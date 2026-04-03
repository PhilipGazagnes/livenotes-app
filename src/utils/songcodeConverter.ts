/**
 * Wrapper for @livenotes/songcode-converter
 */

interface ConversionSuccess {
  success: true
  json: any
}

interface ConversionFailure {
  success: false
  error: string
}

type ConversionResult = ConversionSuccess | ConversionFailure

/**
 * Convert SongCode text to Livenotes JSON
 */
export async function generateLivenotesJson(songcode: string): Promise<ConversionResult> {
  try {
    // Dynamic import to avoid bundling if not needed
    const { SongCodeConverter } = await import('@livenotes/songcode-converter')
    
    // Create converter instance and run conversion
    const converter = new SongCodeConverter()
    const result = converter.convert(songcode)
    
    return {
      success: true,
      json: result
    }
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown conversion error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check if it's a SongCodeError with more details
      if ('line' in error && 'column' in error) {
        const scError = error as any
        errorMessage = `Line ${scError.line}, Column ${scError.column}: ${scError.message}`
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}
