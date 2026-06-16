import { Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { theme } from '../theme'

const { Sider, Content } = Layout

const AppLayout = styled(Layout)`
  min-height: 100vh;
  background: ${theme.bg.app};
`

const AppSider = styled(Sider)`
  background: ${theme.bg.surface} !important;
  border-right: 1px solid ${theme.border.subtle};
`

const AppContent = styled(Content)`
  background: ${theme.bg.app};
  overflow: auto;
`

const navItems = [
  { key: '/projects', label: 'Projects' },
  { key: '/account', label: 'Account' },
]

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey =
    navItems.find(
      (item) => location.pathname === item.key || location.pathname.startsWith(item.key + '/'),
    )?.key ?? '/projects'

  return (
    <AppLayout>
      <AppSider>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: theme.bg.surface, borderRight: 0, height: '100%' }}
        />
      </AppSider>
      <AppContent>
        <Outlet />
      </AppContent>
    </AppLayout>
  )
}
