import { Button, Drawer, Form, Input, Select } from 'antd'
import { styled } from 'styled-components'
import { theme } from '../../theme'
import { useProjectStore, type CreateProjectInput } from '../../store/useProjectStore'

export interface CreateProjectDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${theme.border.subtle};
`

export default function CreateProjectDrawer({ open, onClose, onSuccess }: CreateProjectDrawerProps) {
  const [form] = Form.useForm<CreateProjectInput>()
  const createProject = useProjectStore((s) => s.createProject)

  async function handleSubmit(values: CreateProjectInput) {
    await createProject(values)
    form.resetFields()
    onSuccess()
  }

  function handleClose() {
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title="Create project"
      placement="right"
      width={480}
      open={open}
      onClose={handleClose}
      destroyOnHidden
      footer={
        <FooterActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Create
          </Button>
        </FooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="application_url"
          label="Application URL"
          rules={[{ required: true, message: 'Application URL is required' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="environment"
          label="Environment"
          rules={[{ required: true, message: 'Environment is required' }]}
        >
          <Select>
            <Select.Option value="production">Production</Select.Option>
            <Select.Option value="staging">Staging</Select.Option>
            <Select.Option value="development">Development</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
