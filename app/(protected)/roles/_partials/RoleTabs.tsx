'use client'

import type { RoleContentsProps } from '@/app/(protected)/roles/_partials/RoleContents'
import type { RoleTabsValue } from '@/app/(protected)/roles/_partials/edit'
import {
  ControlDashboardContents,
  ControlMeetContents,
} from '@/app/(protected)/roles/_partials/RoleContents'

export default function RoleTabs({
  activeTab,
  groupedPermissions,
  formApi,
}: RoleContentsProps & { activeTab: RoleTabsValue }) {
  const type = () => {
    switch (activeTab) {
      case 'control_dashboard':
        return <ControlDashboardContents {...{ groupedPermissions, formApi }} />
      case 'control_meet':
        return <ControlMeetContents {...{ groupedPermissions, formApi }} />
    }
  }
  return type()
}
