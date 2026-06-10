import { useState, useEffect, useCallback } from 'react'
import type { UserParams, Users } from './dto'
import { fetchRoles, fetchUsers } from '@/lib/api/admin-api'
import type { Role } from '@/lib/api/admin-api'

export const useParticipants = () => {
  const [users, setUsers] = useState({
    data: [] as Users[],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getUsers = useCallback(async (searchParams?: UserParams) => {
    try {
      setIsLoading(true)

      const response = await fetchUsers({
        params: searchParams,
      })

      setUsers({
        data: response.data,
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.total_pages,
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
