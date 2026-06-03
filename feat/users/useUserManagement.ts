import { useState, useEffect, useCallback } from 'react'
import type { UserParams, Users } from './dto'
import { fetchRoles, fetchUsers } from '@/lib/api/admin-api'
import type { Role } from '@/lib/api/admin-api'

export const useUserManagement = () => {
  const [users, setUsers] = useState<Users[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getUsers = useCallback(async (searchParams?: UserParams) => {
    try {
      setIsLoading(true)
      const { data } = await fetchUsers({ params: searchParams })
      setUsers(data)
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
