import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { styled } from 'styled-components'
import { Button, Drawer, Space, Typography, message } from 'antd'
import { useProjectStore, type ProjectWithDsn } from '../../store/useProjectStore'
import { theme } from '../../theme'

interface ProjectDetailPanelProps {
  project: ProjectWithDsn | null
  onClose: () => void
}

const DsnContainer = styled.div`
  background: ${theme.bg.elevated};
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
`

const DsnLabel = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  color: ${theme.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const DsnValue = styled(Typography.Text)`
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  display: block;
  margin-bottom: 0.75rem;
`

function maskDsn(dsn: string): string {
  return dsn.replace(/:\/\/[^@]+@/, '://••••••••@')
}

export default function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const [revealed, setRevealed] = useState(false)
  const rotateKey = useProjectStore((s) => s.rotateKey)
  const navigate = useNavigate()

  const dsn = project?.dsn ?? ''
  const displayDsn = revealed ? dsn : maskDsn(dsn)

  function handleCopy() {
    navigator.clipboard.writeText(dsn).then(() => {
      message.success('DSN copied to clipboard')
    })
  }

  async function handleRotate() {
    if (project) {
      setRevealed(false)
      await rotateKey(project.id)
    }
  }

  return (
    <Drawer title={project?.name} open={project !== null} onClose={onClose} width={480}>
      {project && (
        <>
          <DsnContainer>
            <DsnLabel>DSN</DsnLabel>
            <DsnValue>{displayDsn}</DsnValue>
            <Space>
              <Button size="small" onClick={handleCopy}>
                Copy
              </Button>
              <Button size="small" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Hide' : 'Reveal'}
              </Button>
            </Space>
          </DsnContainer>
          <Space>
            <Button onClick={() => navigate(`/projects/${project.id}/logs`)}>View Logs</Button>
            <Button danger onClick={handleRotate}>
              Rotate key
            </Button>
          </Space>
        </>
      )}
    </Drawer>
  )
}
