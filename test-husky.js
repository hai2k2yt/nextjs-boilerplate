// This is a test file to demonstrate Husky hooks
// Try committing this file with intentional issues to see Husky in action

const testFunction = () => {
  console.log('Testing Husky setup')

  // Intentional formatting issues (Prettier will fix these)
  const obj = { name: 'test', value: 123 }

  // ESLint will catch unused variables (prefixed with _ to avoid error)
  const _unusedVar = 'This variable is not used'

  return obj
}

// Export the function
module.exports = { testFunction }
