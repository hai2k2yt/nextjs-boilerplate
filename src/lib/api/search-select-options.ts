"use client"

import { SelectOption } from '@/hooks/use-select-options'

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data for searchable options
export interface SearchableUser {
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar?: string
}

export interface SearchableProduct {
  id: string
  name: string
  category: string
  brand: string
  price: number
  inStock: boolean
}

export interface SearchableCity {
  id: string
  name: string
  country: string
  population: number
  timezone: string
}

// Mock data
const mockUsers: SearchableUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', department: 'Engineering', role: 'Developer' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', department: 'Design', role: 'Designer' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', department: 'Marketing', role: 'Manager' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', department: 'Engineering', role: 'Senior Developer' },
  { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', department: 'Sales', role: 'Sales Rep' },
  { id: '6', name: 'Diana Davis', email: 'diana@example.com', department: 'HR', role: 'HR Manager' },
  { id: '7', name: 'Frank Miller', email: 'frank@example.com', department: 'Engineering', role: 'Tech Lead' },
  { id: '8', name: 'Grace Lee', email: 'grace@example.com', department: 'Design', role: 'UX Designer' },
  { id: '9', name: 'Henry Taylor', email: 'henry@example.com', department: 'Marketing', role: 'Content Writer' },
  { id: '10', name: 'Ivy Chen', email: 'ivy@example.com', department: 'Engineering', role: 'DevOps Engineer' },
]

const mockProducts: SearchableProduct[] = [
  { id: '1', name: 'MacBook Pro', category: 'Laptops', brand: 'Apple', price: 2499, inStock: true },
  { id: '2', name: 'iPhone 15', category: 'Phones', brand: 'Apple', price: 999, inStock: true },
  { id: '3', name: 'Samsung Galaxy S24', category: 'Phones', brand: 'Samsung', price: 899, inStock: false },
  { id: '4', name: 'Dell XPS 13', category: 'Laptops', brand: 'Dell', price: 1299, inStock: true },
  { id: '5', name: 'iPad Air', category: 'Tablets', brand: 'Apple', price: 599, inStock: true },
  { id: '6', name: 'Surface Pro', category: 'Tablets', brand: 'Microsoft', price: 1099, inStock: true },
  { id: '7', name: 'AirPods Pro', category: 'Audio', brand: 'Apple', price: 249, inStock: false },
  { id: '8', name: 'Sony WH-1000XM5', category: 'Audio', brand: 'Sony', price: 399, inStock: true },
  { id: '9', name: 'ThinkPad X1', category: 'Laptops', brand: 'Lenovo', price: 1599, inStock: true },
  { id: '10', name: 'Pixel 8', category: 'Phones', brand: 'Google', price: 699, inStock: true },
]

const mockCities: SearchableCity[] = [
  { id: '1', name: 'New York', country: 'USA', population: 8336817, timezone: 'EST' },
  { id: '2', name: 'London', country: 'UK', population: 9648110, timezone: 'GMT' },
  { id: '3', name: 'Tokyo', country: 'Japan', population: 14094034, timezone: 'JST' },
  { id: '4', name: 'Paris', country: 'France', population: 2161000, timezone: 'CET' },
  { id: '5', name: 'Sydney', country: 'Australia', population: 5312163, timezone: 'AEST' },
  { id: '6', name: 'Berlin', country: 'Germany', population: 3669491, timezone: 'CET' },
  { id: '7', name: 'Toronto', country: 'Canada', population: 2794356, timezone: 'EST' },
  { id: '8', name: 'Singapore', country: 'Singapore', population: 5685807, timezone: 'SGT' },
  { id: '9', name: 'Dubai', country: 'UAE', population: 3331420, timezone: 'GST' },
  { id: '10', name: 'Mumbai', country: 'India', population: 12691836, timezone: 'IST' },
]

// Search functions
export async function searchUsers(searchQuery?: string): Promise<SearchableUser[]> {
  await delay(800) // Simulate network delay
  
  // Simulate occasional API errors
  if (Math.random() < 0.05) {
    throw new Error('Failed to search users')
  }
  
  if (!searchQuery || searchQuery.length < 2) {
    return mockUsers.slice(0, 5) // Return first 5 users if no search query
  }
  
  const query = searchQuery.toLowerCase()
  return mockUsers.filter(user => 
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.department.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  )
}

export async function searchProducts(searchQuery?: string): Promise<SearchableProduct[]> {
  await delay(600) // Simulate network delay
  
  // Simulate occasional API errors
  if (Math.random() < 0.05) {
    throw new Error('Failed to search products')
  }
  
  if (!searchQuery || searchQuery.length < 2) {
    return mockProducts.slice(0, 5) // Return first 5 products if no search query
  }
  
  const query = searchQuery.toLowerCase()
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.brand.toLowerCase().includes(query)
  )
}

export async function searchCities(searchQuery?: string): Promise<SearchableCity[]> {
  await delay(500) // Simulate network delay
  
  // Simulate occasional API errors
  if (Math.random() < 0.05) {
    throw new Error('Failed to search cities')
  }
  
  if (!searchQuery || searchQuery.length < 2) {
    return mockCities.slice(0, 5) // Return first 5 cities if no search query
  }
  
  const query = searchQuery.toLowerCase()
  return mockCities.filter(city => 
    city.name.toLowerCase().includes(query) ||
    city.country.toLowerCase().includes(query)
  )
}

// Transform functions
export function transformUsers(users: SearchableUser[]): SelectOption[] {
  return users.map(user => ({
    value: user.id,
    label: `${user.name} (${user.department})`,
    disabled: false,
  }))
}

export function transformProducts(products: SearchableProduct[]): SelectOption[] {
  return products.map(product => ({
    value: product.id,
    label: `${product.name} - ${product.brand} ($${product.price})`,
    disabled: !product.inStock,
  }))
}

export function transformCities(cities: SearchableCity[]): SelectOption[] {
  return cities.map(city => ({
    value: city.id,
    label: `${city.name}, ${city.country}`,
    disabled: false,
  }))
}
