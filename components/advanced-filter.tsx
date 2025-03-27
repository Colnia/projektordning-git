"use client"

import { useState, useCallback } from "react"
import { Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type FilterOption = {
  id: string
  label: string
  options: { value: string; label: string }[]
}

type FilterState = {
  [key: string]: string[]
}

interface AdvancedFilterProps {
  filters: FilterOption[]
  onFilterChange: (filters: FilterState) => void
}

export function AdvancedFilter({ filters, onFilterChange }: AdvancedFilterProps) {
  const [activeFilters, setActiveFilters] = useState<FilterState>({})

  const updateFilter = useCallback((filterId: string, value: string, isActive: boolean) => {
    setActiveFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      
      if (!newFilters[filterId]) {
        newFilters[filterId] = []
      }
      
      if (isActive) {
        newFilters[filterId] = [...newFilters[filterId], value]
      } else {
        newFilters[filterId] = newFilters[filterId].filter(v => v !== value)
      }
      
      if (newFilters[filterId].length === 0) {
        delete newFilters[filterId]
      }

      onFilterChange(newFilters)
      return newFilters
    })
  }, [onFilterChange])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
    onFilterChange({})
  }, [onFilterChange])

  const removeFilter = useCallback((filterId: string, value: string) => {
    updateFilter(filterId, value, false)
  }, [updateFilter])

  const activeFilterCount = Object.values(activeFilters).flat().length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterId, values]) => {
            const filter = filters.find(f => f.id === filterId)
            return values.map(value => {
              const option = filter?.options.find(o => o.value === value)
              return (
                <Badge key={`${filterId}-${value}`} variant="secondary" className="px-3 py-1">
                  {filter?.label}: {option?.label}
                  <button 
                    className="ml-2 rounded-full hover:bg-muted" 
                    onClick={() => removeFilter(filterId, value)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Ta bort {filter?.label} filter</span>
                  </button>
                </Badge>
              )
            })
          })}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="h-7 rounded-full"
            >
              Rensa alla
            </Button>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <Badge className="ml-1 rounded-full px-1 font-normal lg:hidden">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="end">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Filter</div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-0 text-xs font-normal">
                    Rensa alla
                  </Button>
                )}
              </div>
            </div>
            <Separator />
            <div className="p-2 pt-0">
              {filters.map((filter) => (
                <div key={filter.id} className="py-2">
                  <div className="px-2 pb-1 font-medium text-sm">{filter.label}</div>
                  <div className="grid grid-cols-1 gap-1">
                    {filter.options.map((option) => {
                      const isActive = activeFilters[filter.id]?.includes(option.value) || false
                      return (
                        <Button
                          key={option.value}
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="justify-start font-normal"
                          onClick={() => updateFilter(filter.id, option.value, !isActive)}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 