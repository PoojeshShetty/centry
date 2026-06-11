import { Form, Input, Modal, Select } from 'antd'
import { useProjectStore, type CreateProjectInput } from '../../store/useProjectStore'

export interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const [form] = Form.useForm<CreateProjectInput>()
  const createProject = useProjectStore((s) => s.createProject)

  async function handleSubmit(values: CreateProjectInput) {
    await createProject(values)
    form.resetFields()
    onClose()
  }

  function handleCancel() {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="Create project"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      destroyOnHidden
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
    </Modal>
  )
}
