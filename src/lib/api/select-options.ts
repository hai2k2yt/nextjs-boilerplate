"use client"

import { SelectOption } from '@/hooks/use-select-options'

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API responses
export interface ApiCountry {
  code: string
  name: string
  flag: string
  disabled?: boolean
}

export interface ApiSkill {
  id: string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface ApiDepartment {
  id: number
  name: string
  description: string
  active: boolean
}

// Simulated API functions
export async function fetchCountries(): Promise<ApiCountry[]> {
  await delay(1500) // Simulate network delay
  
  // Simulate occasional API errors
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch countries from API')
  }
  
  return [
    { code: 'us', name: 'United States', flag: '🇺🇸' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦' },
    { code: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'de', name: 'Germany', flag: '🇩🇪' },
    { code: 'fr', name: 'France', flag: '🇫🇷' },
    { code: 'jp', name: 'Japan', flag: '🇯🇵' },
    { code: 'au', name: 'Australia', flag: '🇦🇺' },
    { code: 'in', name: 'India', flag: '🇮🇳' },
    { code: 'br', name: 'Brazil', flag: '🇧🇷' },
    { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
    { code: 'es', name: 'Spain', flag: '🇪🇸' },
    { code: 'it', name: 'Italy', flag: '🇮🇹' },
    { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'se', name: 'Sweden', flag: '🇸🇪' },
    { code: 'no', name: 'Norway', flag: '🇳🇴' },
  ]
}

export async function fetchSkills(): Promise<ApiSkill[]> {
  await delay(1200)
  
  if (Math.random() < 0.05) {
    throw new Error('Skills service temporarily unavailable')
  }
  
  return [
    { id: '1', name: 'JavaScript', category: 'Programming', level: 'intermediate' },
    { id: '2', name: 'TypeScript', category: 'Programming', level: 'intermediate' },
    { id: '3', name: 'React', category: 'Frontend', level: 'advanced' },
    { id: '4', name: 'Next.js', category: 'Frontend', level: 'advanced' },
    { id: '5', name: 'Node.js', category: 'Backend', level: 'intermediate' },
    { id: '6', name: 'Python', category: 'Programming', level: 'beginner' },
    { id: '7', name: 'Django', category: 'Backend', level: 'intermediate' },
    { id: '8', name: 'PostgreSQL', category: 'Database', level: 'intermediate' },
    { id: '9', name: 'MongoDB', category: 'Database', level: 'beginner' },
    { id: '10', name: 'Docker', category: 'DevOps', level: 'beginner' },
    { id: '11', name: 'AWS', category: 'Cloud', level: 'intermediate' },
    { id: '12', name: 'UI/UX Design', category: 'Design', level: 'advanced' },
  ]
}

export async function fetchDepartments(): Promise<ApiDepartment[]> {
  await delay(800)
  
  return [
    { id: 1, name: 'Engineering', description: 'Software development and technical roles', active: true },
    { id: 2, name: 'Product', description: 'Product management and strategy', active: true },
    { id: 3, name: 'Design', description: 'UI/UX and visual design', active: true },
    { id: 4, name: 'Marketing', description: 'Digital marketing and growth', active: true },
    { id: 5, name: 'Sales', description: 'Business development and sales', active: true },
    { id: 6, name: 'Operations', description: 'Business operations and support', active: true },
    { id: 7, name: 'Finance', description: 'Financial planning and analysis', active: true },
    { id: 8, name: 'Human Resources', description: 'People and culture', active: true },
    { id: 9, name: 'Legal', description: 'Legal and compliance', active: false }, // Inactive department
  ]
}

// Transform functions to convert API responses to SelectOption format
export const transformCountries = (countries: ApiCountry[]): SelectOption[] => {
  return countries.map(country => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
    disabled: country.disabled
  }))
}

export const transformSkills = (skills: ApiSkill[]): SelectOption[] => {
  return skills.map(skill => ({
    value: skill.id,
    label: `${skill.name} (${skill.category})`,
    disabled: false
  }))
}

export const transformDepartments = (departments: ApiDepartment[]): SelectOption[] => {
  return departments
    .filter(dept => dept.active) // Only show active departments
    .map(dept => ({
      value: dept.id.toString(),
      label: dept.name,
      disabled: false
    }))
}
