import { Skeleton } from 'antd'
import { styled } from 'styled-components'

const Panel = styled.div`
  height: 100%;
  min-height: 100vh;
  background: #0a1628;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
`

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.25rem;
`

export function AuthRightPanel() {
  return (
    <Panel>
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    </Panel>
  )
}

export default AuthRightPanel
