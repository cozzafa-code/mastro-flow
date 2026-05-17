'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Layout, FilterType, SortType, Commessa } from '@/lib/commesse-types'
import { fetchCommesse, countCommessePerFiltro } from '@/lib/commesse-queries'

const SORT_KEY = 'fliwox_commesse_sort'
const LAYOUT_KEY = 'fliwox_commesse_layout'

export function useCommesse() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Layout persistito in localStorage
  const [layout, setLayoutState] = useState<Layout>('card')
  // Filtro da URL param
  const [filter, setFilterState] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  )
  // Sort da localStorage
  const [sort, setSortState] = useState<SortType>('updated_desc')
  const [search, setSearch] = useState('')
  const [commesse, setCommesse] = useState<Commessa[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  // Init da storage
  useEffect(() => {
    const savedLayout = localStorage.getItem(LAYOUT_KEY) as Layout
    if (savedLayout) setLayoutState(savedLayout)
    const savedSort = localStorage.getItem(SORT_KEY) as SortType
    if (savedSort) setSortState(savedSort)
  }, [])

  // Carica commesse
  const carica = useCallback(async () => {
    setLoading(true)
    const [data, c] = await Promise.all([
      fetchCommesse(filter, sort, search),
      countCommessePerFiltro(),
    ])
    setCommesse(data)
    setCounts(c)
    setLoading(false)
  }, [filter, sort, search])

  useEffect(() => {
    const t = search.length > 0 && search.length < 2
      ? undefined
      : setTimeout(carica, search.length > 0 ? 300 : 0)
    return () => clearTimeout(t)
  }, [carica, search])

  const setLayout = useCallback((l: Layout) => {
    setLayoutState(l)
    localStorage.setItem(LAYOUT_KEY, l)
  }, [])

  const setFilter = useCallback((f: FilterType) => {
    setFilterState(f)
    const params = new URLSearchParams(searchParams.toString())
    if (f === 'all') params.delete('filter')
    else params.set('filter', f)
    router.replace(`/commesse?${params.toString()}`, { scroll: false })
    setFilterSheetOpen(false)
  }, [router, searchParams])

  const setSort = useCallback((s: SortType) => {
    setSortState(s)
    localStorage.setItem(SORT_KEY, s)
    setSortSheetOpen(false)
  }, [])

  return {
    layout, setLayout,
    filter, setFilter,
    sort, setSort,
    search, setSearch,
    commesse, counts, loading,
    filterSheetOpen, setFilterSheetOpen,
    sortSheetOpen, setSortSheetOpen,
  }
}
