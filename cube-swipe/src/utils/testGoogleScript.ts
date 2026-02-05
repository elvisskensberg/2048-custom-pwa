// Test utility to verify Google Apps Script integration
// Run this in the browser console to test the API

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5cPbNkM1kKZ7DANj7Ql4OWguS7shXwCabdpXWmNtBbr1YaOsp1r6lukCfHgoGRLfLXw/exec"

export async function testGoogleScriptAPI() {
  console.log('Testing Google Apps Script API...')

  try {
    const testData = new URLSearchParams()
    testData.append('contact', 'test@example.com')
    testData.append('comment', 'Test comment from React app')
    testData.append('timestamp', new Date().toISOString())

    console.log('Sending test data:', Object.fromEntries(testData))

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: testData,
      mode: 'no-cors' // Note: With no-cors, we can't read the response
    })

    console.log('✅ Request sent successfully!')
    console.log('Response status:', response.status)
    console.log('Response type:', response.type)
    console.log('')
    console.log('⚠️ Note: With mode: "no-cors", we cannot read the response body.')
    console.log('Check your Google Sheet to verify the data was added.')
    console.log('Expected: A new row with test@example.com and "Test comment from React app"')

    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Auto-run if in development
if (import.meta.env.DEV) {
  console.log('Google Script API test utility loaded.')
  console.log('Run testGoogleScriptAPI() in the console to test the integration.')
}
