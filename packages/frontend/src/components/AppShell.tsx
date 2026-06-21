import { ConfigProvider, Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { theme } from '../theme'

const { Sider, Content } = Layout

const AppLayout = styled(Layout)`
  min-height: 100vh;
  background: ${theme.app.bg};
`

const AppSider = styled(Sider)`
  background: ${theme.app.bg} !important;
  border-right: 1px solid ${theme.app.border};
`

const AppContent = styled(Content)`
  background: ${theme.app.bg};
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
        <ConfigProvider theme={{ token: { colorPrimary: theme.auth.accent } }}>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={navItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: theme.app.bg, borderRight: 0, height: '100%' }}
          />
        </ConfigProvider>
      </AppSider>
      <AppContent>
        <Outlet />
      </AppContent>
    </AppLayout>
  )
}
