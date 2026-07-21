'use client'

import type { TabsValue } from '@/feat/rooms/dto'
import type { RoomContentsProps } from '@/components/features/rooms/RoomContents'
import { useEffect } from 'react'
import { getOnePresentation } from '@/lib/api/admin-api'
import {
  OverviewContent,
  ParticipantsContent,
  SettingsContent,
} from '@/components/features/rooms/RoomContents'

export default function RoomTabs({
  activeTab,
  overview,
  participants,
  settings,
}: { activeTab: TabsValue } & RoomContentsProps) {
  const { room, files, setFiles, maxFile, handleUploadFile, handleRemoveFile } = overview
  const {
    allParticipants,
    searchParticipants,
    filterParticipants,
    onClose,
    setIsOpenBlock,
    setUserIdentity,
  } = participants
  const { setIsOpenDelete } = settings
  const loadPresentations = async () => {
    try {
      const file = await getOnePresentation(room?.id || 0)
      if (setFiles) setFiles(Array.isArray(file) ? file : file ? [file] : [])
    } catch (error) {
      console.error('Failed to load data', error)
    }
  }

  useEffect(() => {
    if (room?.id) {
      loadPresentations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id])

  const type = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent {...{ room, files, maxFile, handleUploadFile, handleRemoveFile }} />
      case 'participants':
        return (
          <ParticipantsContent
            {...{
              allParticipants,
              searchParticipants,
              filterParticipants,
              onClose,
              setIsOpenBlock,
              setUserIdentity,
            }}
          />
        )
      case 'settings':
        return <SettingsContent {...{ onClose, setIsOpenDelete, room }} />
    }
  }
  return type()
}
