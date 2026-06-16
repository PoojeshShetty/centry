import { useEffect, useState } from 'react'
import { styled } from 'styled-components'
import { Button, Modal } from 'antd'
import { useProjectStore } from '../../store/useProjectStore'
import ProjectCard from './ProjectCard'
import CreateProjectDrawer from './CreateProjectDrawer'
import ProjectDetailPanel from './ProjectDetailPanel'

const PageWrapper = styled.div`
  padding: 2rem;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #8c8c8c;
`

export default function ProjectsPage() {
  const { projects, fetchProjects, archiveProject, selectedProject, selectProject } =
    useProjectStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  function handleArchive(id: string) {
    Modal.confirm({
      title: 'Archive project?',
      content: 'This project will be archived and will no longer accept new logs.',
      onOk: () => archiveProject(id),
    })
  }

  return (
    <PageWrapper>
      <Header>
        <h1>Projects</h1>
        <Button type="primary" onClick={() => setDrawerOpen(true)}>
          Create project
        </Button>
      </Header>
      {projects.length === 0 ? (
        <EmptyState>
          <p>No projects yet.</p>
          <Button type="primary" onClick={() => setDrawerOpen(true)}>
            Create project
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onSelect={selectProject}
              onArchive={handleArchive}
            />
          ))}
        </Grid>
      )}
      <CreateProjectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => { setDrawerOpen(false); fetchProjects() }}
      />
      <ProjectDetailPanel project={selectedProject} onClose={() => selectProject(null)} />
    </PageWrapper>
  )
}
