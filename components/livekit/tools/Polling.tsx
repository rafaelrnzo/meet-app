import { createContext, useContext, useEffect, useState } from 'react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import { DataPacket_Kind, RoomEvent } from 'livekit-client'
import { Plus, X, BarChart2, Check, SkipForward } from 'lucide-react'

// --- Types ---

export interface PollOption {
  id: string
  text: string
  count: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  isActive: boolean
  createdBy: string
  roomId?: string
  hasVoted?: boolean
}

type PollPacket =
  | { type: 'POLL_CREATE'; poll: Poll }
  | { type: 'POLL_VOTE'; pollId: string; optionId: string; voterIdentity: string }
  | { type: 'POLL_CLOSE'; pollId: string }

interface PollingState {
  activePoll: Poll | null
  createPoll: (question: string, optionsTexts: string[]) => Promise<void>
  vote: (pollId: string, optionId: string) => Promise<void>
  closePoll: (pollId: string) => Promise<void>
  skipPoll: () => void
}

const PollingContext = createContext<PollingState | null>(null)

export function usePolling() {
  const context = useContext(PollingContext)
  if (!context) {
    throw new Error('usePolling must be used within a PollingProvider')
  }
  return context
}

export function PollingProvider({ children }: { children: React.ReactNode }) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const roomName = room?.name || 'default'

  const getVotedPolls = () => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(sessionStorage.getItem(`voted_polls_${roomName}`) || '[]') as string[]
    } catch {
      return []
    }
  }

  const markAsVoted = (pollId: string) => {
    const voted = getVotedPolls()
    if (!voted.includes(pollId)) {
      sessionStorage.setItem(`voted_polls_${roomName}`, JSON.stringify([...voted, pollId]))
    }
  }

  const publish = async (data: PollPacket) => {
    if (!room) return
    const encoder = new TextEncoder()
    const payload = encoder.encode(JSON.stringify(data))
    await room.localParticipant.publishData(payload, { reliable: true, topic: 'polling' })
  }

  useEffect(() => {
    if (!room) return

    const onData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      if (kind !== DataPacket_Kind.RELIABLE) return
      if (topic !== 'polling') return
      const str = new TextDecoder().decode(payload)
      try {
        const data = JSON.parse(str) as PollPacket

        if (data.type === 'POLL_CREATE') {
          const voted = getVotedPolls()
          setActivePoll({ ...data.poll, hasVoted: voted.includes(data.poll.id) })
          window.dispatchEvent(new CustomEvent('poll-created', { detail: data.poll }))
        }

        if (data.type === 'POLL_VOTE') {
          setActivePoll((prev) => {
            if (!prev || prev.id !== data.pollId) return prev
            if (prev.options) {
              const newOptions = prev.options.map((opt) =>
                opt.id === data.optionId ? { ...opt, count: opt.count + 1 } : opt
              )
              return { ...prev, options: newOptions }
            }
            return prev
          })
        }

        if (data.type === 'POLL_CLOSE') {
          setActivePoll((prev) => {
            if (!prev || prev.id !== data.pollId) return prev
            return { ...prev, isActive: false }
          })
        }
      } catch (e) {
        console.error('Failed to parse poll data', e)
      }
    }

    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room])

  const createPoll = async (question: string, optionsTexts: string[]) => {
    const poll: Poll = {
      id: Date.now().toString(),
      question,
      options: optionsTexts.map((text, i) => ({ id: i.toString(), text, count: 0 })),
      isActive: true,
      createdBy: localParticipant.identity,
      roomId: roomName,
    }
    await publish({ type: 'POLL_CREATE', poll })
    setActivePoll(poll)
  }

  const vote = async (pollId: string, optionId: string) => {
    if (!activePoll || activePoll.id !== pollId) return
    if (activePoll.hasVoted) return

    await publish({ type: 'POLL_VOTE', pollId, optionId, voterIdentity: localParticipant.identity })

    markAsVoted(pollId)

    // Optimistic update
    setActivePoll((prev) => {
      if (!prev) return null
      const newOptions = prev.options.map((opt) =>
        opt.id === optionId ? { ...opt, count: opt.count + 1 } : opt
      )
      return { ...prev, options: newOptions, hasVoted: true }
    })
  }

  const closePoll = async (pollId: string) => {
    await publish({ type: 'POLL_CLOSE', pollId })
    setActivePoll((prev) => (prev ? { ...prev, isActive: false } : null))

    // Save to DB
    if (activePoll) {
      await savePollToDb(activePoll)
    }
  }

  const skipPoll = () => {
    setActivePoll(null)
  }

  return (
    <PollingContext.Provider value={{ activePoll, createPoll, vote, closePoll, skipPoll }}>
      {children}
    </PollingContext.Provider>
  )
}

async function savePollToDb(poll: Poll) {
  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || 'http://localhost:8080'
  const token = localStorage.getItem('vc_token')
  try {
    await fetch(`${API_BASE}/admin/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...poll,
        poll_id: poll.id,
        id: undefined, // Remove string ID to avoid conflict with backend uint ID
        isActive: false, // Ensure stored poll is marked as closed
      }),
    })
  } catch (e) {
    console.error('Failed to save poll', e)
  }
}

// --- Components ---

export function PollingTool({ isAdmin }: { isAdmin: boolean }) {
  const { activePoll, createPoll, vote, closePoll, skipPoll } = usePolling()
  const [view, setView] = useState<'list' | 'create'>('list')

  if (view === 'create') {
    return <PollCreator onCancel={() => setView('list')} onCreate={createPoll} />
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Active Queue</h3>
        {isAdmin && (
          <button
            onClick={() => setView('create')}
            className='hover:bg-muted text-primary rounded p-1'
            title='Create Poll'
          >
            <Plus className='h-4 w-4' />
          </button>
        )}
      </div>

      {!activePoll && (
        <div className='text-muted-foreground py-8 text-center text-xs'>No active polls.</div>
      )}

      {activePoll && (
        <div className='border-border bg-card/50 rounded-lg border p-3'>
          <div className='mb-2 flex items-start justify-between'>
            <span className='text-sm font-medium'>{activePoll.question}</span>
            {isAdmin && activePoll.isActive && (
              <button
                onClick={() => closePoll(activePoll.id)}
                className='text-destructive text-[10px] hover:underline'
              >
                Close Poll
              </button>
            )}
          </div>

          {!activePoll.isActive || activePoll.hasVoted ? (
            <PollResult poll={activePoll} />
          ) : (
            <PollActive poll={activePoll} onVote={vote} onSkip={skipPoll} />
          )}
        </div>
      )}
    </div>
  )
}

function PollCreator({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (q: string, o: string[]) => void
}) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const handleSubmit = () => {
    if (!question.trim()) return
    const validOptions = options.filter((o) => o.trim())
    if (validOptions.length < 2) return
    onCreate(question, validOptions)
    onCancel()
  }

  return (
    <div className='space-y-3 p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Create Poll</h3>
        <button onClick={onCancel}>
          <X className='h-4 w-4' />
        </button>
      </div>

      <input
        className='bg-muted/50 border-border w-full rounded border p-2 text-sm'
        placeholder='Enter question...'
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className='space-y-2'>
        {options.map((opt, i) => (
          <input
            key={i}
            className='bg-muted/50 border-border w-full rounded border p-2 text-sm'
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => {
              const newOpts = [...options]
              newOpts[i] = e.target.value
              setOptions(newOpts)
            }}
          />
        ))}
      </div>

      <button
        onClick={() => setOptions([...options, ''])}
        className='text-primary text-xs hover:underline'
      >
        + Add Option
      </button>

      <button
        onClick={handleSubmit}
        className='bg-primary text-primary-foreground mt-4 w-full rounded py-2 text-sm font-medium'
      >
        Start Poll
      </button>
    </div>
  )
}

function PollActive({
  poll,
  onVote,
  onSkip,
}: {
  poll: Poll
  onVote: (pid: string, oid: string) => void
  onSkip: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className='space-y-2'>
      {poll.options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setSelected(opt.id)}
          className={`w-full rounded border p-2 text-left text-sm transition-colors ${
            selected === opt.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
          }`}
        >
          {opt.text}
        </button>
      ))}
      <div className='flex gap-2 pt-2'>
        <button
          disabled={!selected}
          onClick={() => selected && onVote(poll.id, selected)}
          className='bg-primary text-primary-foreground flex-1 rounded py-1.5 text-xs font-medium disabled:opacity-50'
        >
          Vote
        </button>
        <button
          onClick={onSkip}
          className='border-border hover:bg-muted text-muted-foreground flex w-8 items-center justify-center rounded border'
          title='Skip'
        >
          <SkipForward className='h-4 w-4' />
        </button>
      </div>
    </div>
  )
}

function PollResult({ poll }: { poll: Poll }) {
  const total = poll.options.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <div className='space-y-3'>
      {poll.options.map((opt) => {
        const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100)
        return (
          <div key={opt.id} className='space-y-1'>
            <div className='flex justify-between text-xs'>
              <span>{opt.text}</span>
              <span>{percent}%</span>
            </div>
            <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
              <div
                className='bg-primary h-full transition-all duration-500'
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className='text-muted-foreground pt-1 text-center text-[10px]'>Total votes: {total}</div>
    </div>
  )
}
