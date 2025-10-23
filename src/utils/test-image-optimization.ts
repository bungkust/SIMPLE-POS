/**
 * Test utilities for image optimization
 * Use these functions to verify that image optimization is working correctly
 */

import { 
  getOptimizedImageUrl, 
  getThumbnailUrl, 
  getMediumImageUrl, 
  getLargeImageUrl,
  getProgressivePlaceholder 
} from '@/lib/image-utils';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  originalUrl?: string;
  optimizedUrl?: string;
  expectedParams?: string[];
}

/**
 * Test image optimization functions
 */
export function testImageOptimization(): TestResult[] {
  const results: TestResult[] = [];
  
  // Test URL - replace with your actual Supabase Storage URL
  const testUrl = 'https://your-project.supabase.co/storage/v1/object/public/menu-images/test.jpg';
  
  // Test 1: Basic optimization
  try {
    const optimized = getOptimizedImageUrl(testUrl, { width: 400, height: 300, quality: 80 });
    const hasParams = optimized.includes('width=') && optimized.includes('height=') && optimized.includes('quality=');
    
    results.push({
      testName: 'Basic Image Optimization',
      passed: hasParams,
      details: hasParams ? 'Optimization parameters added successfully' : 'No optimization parameters found',
      originalUrl: testUrl,
      optimizedUrl: optimized,
      expectedParams: ['width=', 'height=', 'quality=']
    });
  } catch (error) {
    results.push({
      testName: 'Basic Image Optimization',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  // Test 2: Thumbnail generation
  try {
    const thumbnail = getThumbnailUrl(testUrl, { width: 200, height: 200 });
    const hasThumbnailParams = thumbnail.includes('width=200') && thumbnail.includes('height=200');
    
    results.push({
      testName: 'Thumbnail Generation',
      passed: hasThumbnailParams,
      details: hasThumbnailParams ? 'Thumbnail parameters correct' : 'Thumbnail parameters missing',
      originalUrl: testUrl,
      optimizedUrl: thumbnail,
      expectedParams: ['width=200', 'height=200']
    });
  } catch (error) {
    results.push({
      testName: 'Thumbnail Generation',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  // Test 3: Medium image generation
  try {
    const medium = getMediumImageUrl(testUrl, { width: 800, height: 600 });
    const hasMediumParams = medium.includes('width=800') && medium.includes('height=600');
    
    results.push({
      testName: 'Medium Image Generation',
      passed: hasMediumParams,
      details: hasMediumParams ? 'Medium image parameters correct' : 'Medium image parameters missing',
      originalUrl: testUrl,
      optimizedUrl: medium,
      expectedParams: ['width=800', 'height=600']
    });
  } catch (error) {
    results.push({
      testName: 'Medium Image Generation',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  // Test 4: Large image generation
  try {
    const large = getLargeImageUrl(testUrl, { width: 1200, height: 900 });
    const hasLargeParams = large.includes('width=1200') && large.includes('height=900');
    
    results.push({
      testName: 'Large Image Generation',
      passed: hasLargeParams,
      details: hasLargeParams ? 'Large image parameters correct' : 'Large image parameters missing',
      originalUrl: testUrl,
      optimizedUrl: large,
      expectedParams: ['width=1200', 'height=900']
    });
  } catch (error) {
    results.push({
      testName: 'Large Image Generation',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  // Test 5: Progressive placeholder
  try {
    const placeholder = getProgressivePlaceholder(testUrl, { width: 200, height: 200 });
    const hasPlaceholderParams = placeholder.includes('width=200') && placeholder.includes('height=200') && placeholder.includes('quality=20');
    
    results.push({
      testName: 'Progressive Placeholder',
      passed: hasPlaceholderParams,
      details: hasPlaceholderParams ? 'Placeholder parameters correct' : 'Placeholder parameters missing',
      originalUrl: testUrl,
      optimizedUrl: placeholder,
      expectedParams: ['width=200', 'height=200', 'quality=20']
    });
  } catch (error) {
    results.push({
      testName: 'Progressive Placeholder',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  // Test 6: Non-Supabase URL handling
  try {
    const nonSupabaseUrl = 'https://example.com/image.jpg';
    const result = getOptimizedImageUrl(nonSupabaseUrl, { width: 400, height: 300 });
    const unchanged = result === nonSupabaseUrl;
    
    results.push({
      testName: 'Non-Supabase URL Handling',
      passed: unchanged,
      details: unchanged ? 'Non-Supabase URLs returned unchanged' : 'Non-Supabase URLs were modified',
      originalUrl: nonSupabaseUrl,
      optimizedUrl: result
    });
  } catch (error) {
    results.push({
      testName: 'Non-Supabase URL Handling',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  return results;
}

/**
 * Test performance monitoring
 */
export function testPerformanceMonitoring(): TestResult[] {
  const results: TestResult[] = [];
  
  try {
    // Check if performance monitor is available
    const hasPerformanceMonitor = typeof window !== 'undefined' && 
      (window as any).performanceMonitor !== undefined;
    
    results.push({
      testName: 'Performance Monitor Available',
      passed: hasPerformanceMonitor,
      details: hasPerformanceMonitor ? 'Performance monitor is available' : 'Performance monitor not found'
    });
    
    if (hasPerformanceMonitor) {
      const summary = (window as any).performanceMonitor.getPerformanceSummary();
      const hasSummary = summary && typeof summary === 'object';
      
      results.push({
        testName: 'Performance Summary',
        passed: hasSummary,
        details: hasSummary ? 'Performance summary available' : 'Performance summary not available'
      });
    }
  } catch (error) {
    results.push({
      testName: 'Performance Monitoring',
      passed: false,
      details: `Error: ${error}`
    });
  }
  
  return results;
}

/**
 * Run all tests and display results
 */
export function runAllTests(): void {
  console.log('🧪 Running Image Optimization Tests...\n');
  
  const imageTests = testImageOptimization();
  const performanceTests = testPerformanceMonitoring();
  
  const allTests = [...imageTests, ...performanceTests];
  
  let passed = 0;
  let failed = 0;
  
  allTests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.testName}: ${test.details}`);
    
    if (test.optimizedUrl && test.expectedParams) {
      console.log(`   Original: ${test.originalUrl}`);
      console.log(`   Optimized: ${test.optimizedUrl}`);
      console.log(`   Expected params: ${test.expectedParams.join(', ')}`);
    }
    
    if (test.passed) {
      passed++;
    } else {
      failed++;
    }
    
    console.log('');
  });
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Image optimization is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }
}

/**
 * Test with real image URLs from your Supabase Storage
 */
export function testWithRealUrls(imageUrls: string[]): TestResult[] {
  const results: TestResult[] = [];
  
  imageUrls.forEach((url, index) => {
    try {
      const optimized = getOptimizedImageUrl(url, { width: 400, height: 300, quality: 80 });
      const hasParams = optimized.includes('width=') && optimized.includes('height=') && optimized.includes('quality=');
      
      results.push({
        testName: `Real URL Test ${index + 1}`,
        passed: hasParams,
        details: hasParams ? 'Real URL optimized successfully' : 'Real URL optimization failed',
        originalUrl: url,
        optimizedUrl: optimized,
        expectedParams: ['width=', 'height=', 'quality=']
      });
    } catch (error) {
      results.push({
        testName: `Real URL Test ${index + 1}`,
        passed: false,
        details: `Error: ${error}`,
        originalUrl: url
      });
    }
  });
  
  return results;
}

/**
 * Quick test function to run in browser console
 */
export function quickTest(): void {
  console.log('🚀 Quick Image Optimization Test');
  console.log('================================');
  
  // Test with a sample Supabase URL
  const sampleUrl = 'https://your-project.supabase.co/storage/v1/object/public/menu-images/sample.jpg';
  
  console.log('Testing with sample URL:', sampleUrl);
  
  try {
    const optimized = getOptimizedImageUrl(sampleUrl, { width: 400, height: 300, quality: 80 });
    console.log('✅ Optimization working:', optimized);
    
    const thumbnail = getThumbnailUrl(sampleUrl);
    console.log('✅ Thumbnail working:', thumbnail);
    
    const medium = getMediumImageUrl(sampleUrl);
    console.log('✅ Medium image working:', medium);
    
    const large = getLargeImageUrl(sampleUrl);
    console.log('✅ Large image working:', large);
    
    console.log('🎉 All basic functions working!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Make functions available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).testImageOptimization = {
    runAllTests,
    quickTest,
    testImageOptimization,
    testPerformanceMonitoring,
    testWithRealUrls
  };
  
  console.log('🧪 Image optimization test functions available:');
  console.log('- window.testImageOptimization.quickTest()');
  console.log('- window.testImageOptimization.runAllTests()');
  console.log('- window.testImageOptimization.testWithRealUrls([url1, url2])');
}

