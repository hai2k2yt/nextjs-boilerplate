// This file has intentional ESLint errors that cannot be auto-fixed

const testFunction = () => {
  console.log('Testing ESLint errors')

  // Fixed: unused variable with underscore prefix
  const _unusedVariable = 'This is now properly prefixed'

  // Fixed: using const instead of let and prefixed with underscore
  const _shouldBeConst = 'This should be const'

  return 'test'
}

// Fixed: unused function with underscore prefix
const _unusedFunction = () => {
  return 'unused'
}

module.exports = { testFunction }
