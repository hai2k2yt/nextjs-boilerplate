// This file has intentional TypeScript errors

interface User {
  id: number
  name: string
  email: string
}

const testFunction = (): string => {
  const user: User = {
    id: 123, // Fixed: now a number
    name: 'John Doe', // Fixed: now a string
    email: 'test@example.com',
  }

  // Fixed: returning string instead of number
  return user.name
}

export { testFunction }
