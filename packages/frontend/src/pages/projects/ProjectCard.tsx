import { styled } from 'styled-components'
import { Button } from 'antd'
import type { ProjectWithDsn } from '../../store/useProjectStore'
import { theme } from '../../theme'

export interface ProjectCardProps {
  project: ProjectWithDsn
  onSelect: (p: ProjectWithDsn) => void
  onArchive: (id: string) => void
}

const Card = styled.div`
  border: 1px solid ${theme.app.border};
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${theme.app.surface};
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
`

const ProjectName = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: ${theme.app.text};
`

const ProjectUrl = styled.p`
  margin: 0;
  color: ${theme.app.textSecondary};
  font-size: 0.875rem;
  word-break: break-all;
`

const EnvironmentBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  background-color: ${theme.app.elevated};
  color: ${theme.app.textSecondary};
  align-self: flex-start;
`

const CreatedAt = styled.time`
  font-size: 0.75rem;
  color: ${theme.app.textSecondary};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`

export default function ProjectCard({ project, onSelect, onArchive }: ProjectCardProps) {
  return (
    <Card onClick={() => onSelect(project)}>
      <ProjectName>{project.name}</ProjectName>
      <ProjectUrl>{project.application_url}</ProjectUrl>
      <EnvironmentBadge>{project.environment}</EnvironmentBadge>
      <CreatedAt>{new Date(project.created_at).toLocaleDateString()}</CreatedAt>
      <Actions>
        <Button
          danger
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(project.id)
          }}
        >
          Archive
        </Button>
      </Actions>
    </Card>
  )
}
