import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { styled } from 'styled-components'
import { useLogStore } from '../../store/useLogStore'

const LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const
type LevelOption = (typeof LEVELS)[number]

const TIME_PRESETS = [
  { label: '1h', seconds: 3600 },
  { label: '6h', seconds: 6 * 3600 },
  { label: '24h', seconds: 24 * 3600 },
  { label: '7d', seconds: 7 * 24 * 3600 },
] as const

const Bar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
`

const PillGroup = styled.div`
  display: flex;
  gap: 0.25rem;
`

const Pill = styled.button<{ $active?: boolean }>`
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? '#1677ff' : '#d9d9d9')};
  background: ${({ $active }) => ($active ? '#e6f4ff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1677ff' : '#595959')};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    border-color: #1677ff;
    color: #1677ff;
  }
`

const SearchInput = styled.input`
  padding: 0.25rem 0.625rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 200px;
  &:focus {
    outline: none;
    border-color: #1677ff;
  }
`

const PresetGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
`

const PresetBtn = styled.button`
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
  &:hover {
    border-color: #1677ff;
    color: #1677ff;
  }
`

export default function FilterBar() {
  const { filters, setFilter } = useLogStore()
  const [, setSearchParams] = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const activeLevel: LevelOption =
    filters.level?.length ? (filters.level[0].toUpperCase() as LevelOption) : 'ALL'

  function selectLevel(level: LevelOption) {
    const levels = level === 'ALL' ? undefined : [level.toLowerCase()]
    setFilter('level', levels)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (levels?.length) {
        next.set('level', levels.join(','))
      } else {
        next.delete('level')
      }
      return next
    })
  }

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const searchVal = value || undefined
      setFilter('search', searchVal)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchVal) {
          next.set('search', searchVal)
        } else {
          next.delete('search')
        }
        return next
      })
    }, 300)
  }

  function selectTimePreset(seconds: number) {
    const end = Math.floor(Date.now() / 1000)
    const start = end - seconds
    setFilter('start', start)
    setFilter('end', end)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('start', String(start))
      next.set('end', String(end))
      return next
    })
  }

  return (
    <Bar>
      <PillGroup>
        {LEVELS.map((level) => (
          <Pill key={level} $active={activeLevel === level} onClick={() => selectLevel(level)}>
            {level}
          </Pill>
        ))}
      </PillGroup>
      <SearchInput
        placeholder="Search logs..."
        defaultValue={filters.search ?? ''}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <PresetGroup>
        {TIME_PRESETS.map(({ label, seconds }) => (
          <PresetBtn key={label} onClick={() => selectTimePreset(seconds)}>
            {label}
          </PresetBtn>
        ))}
      </PresetGroup>
    </Bar>
  )
}
