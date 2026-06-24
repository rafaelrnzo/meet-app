import type { Role } from '@/lib/api/admin-api'
import type { UserParams, Users } from './dto'
import { useState, useEffect, useCallback } from 'react'
import { fetchRoles, fetchUsers } from '@/lib/api/admin-api'

export const useParticipants = () => {
  const [users, setUsers] = useState({
    data: [] as Users[],
    page: 1,
    total: 0,
    totalPages: 0,
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getUsers = useCallback(async (searchParams?: UserParams) => {
    try {
      setIsLoading(true)

      const response = await fetchUsers({
        params: {
          ...searchParams,
          limit: 99999, // Note: fetch all
        },
      })

      setUsers({
        data: response.data,
        page: response.page ?? 1,
        total: response.total ?? 0,
        totalPages: response.total_pages ?? 0,
      })
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRoles = useCallback(async () => {
    try {
      const response = await fetchRoles()
      setRoles(response || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }, [])

  useEffect(() => {
    getUsers()
    getRoles()
  }, [getUsers, getRoles])

  return {
    users,
    roles,
    isLoading,
    setUsers,
    setRoles,
    refetchUsers: getUsers,
    refetchRoles: getRoles,
  }
}
