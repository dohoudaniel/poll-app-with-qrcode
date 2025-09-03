/**
 * Simple test to verify Jest setup is working
 */

describe('Poll Actions Setup Test', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })

  it('should mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})

describe('Environment Setup', () => {
  it('should have environment variables set', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
  })
})

describe('Mock Utilities', () => {
  it('should have global mock utilities available', () => {
    expect(global.mockSupabaseResponse).toBeDefined()
    expect(global.mockSupabaseError).toBeDefined()
    
    const successResponse = global.mockSupabaseResponse({ id: 1 })
    expect(successResponse).toEqual({ data: { id: 1 }, error: null })
    
    const errorResponse = global.mockSupabaseError('Test error')
    expect(errorResponse).toEqual({ data: null, error: { message: 'Test error' } })
  })
})
