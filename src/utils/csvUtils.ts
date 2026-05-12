import { NewToiletData } from '../services/firebase';

export interface CSVToiletRow {
  name: string;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  coordinates?: string; // "lat, lng" format
  type?: 'public' | 'commercial' | 'event';
  gender?: 'unisex' | 'separated';
  price_type?: 'free' | 'paid';
  price_amount?: string | number;
  accessibility?: 'true' | 'false' | boolean;
  amenities?: string; // comma-separated like "paper,bidet,soap"
  image_url1?: string;
  image_url2?: string;
  image_url3?: string;
}

export interface ParseResult {
  success: boolean;
  data?: Array<NewToiletData & { imageUrls: string[] }>;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

/**
 * Parse CSV text content into toilet data objects
 */
export const parseCSV = (csvText: string): ParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: Array<NewToiletData & { imageUrls: string[] }> = [];

  try {
    // Split by newlines and handle different line endings
    const lines = csvText.trim().split(/\r?\n/);
    
    if (lines.length < 2) {
      errors.push('CSV file must have a header row and at least one data row');
      return { success: false, errors, warnings, rowCount: 0 };
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    // Check for required fields - either coordinates OR (latitude AND longitude)
    const hasCoordinates = headers.includes('coordinates');
    const hasLatLng = headers.includes('latitude') && headers.includes('longitude');
    const hasName = headers.includes('name');
    
    if (!hasName) {
      errors.push('Missing required column: name');
      return { success: false, errors, warnings, rowCount: 0 };
    }
    
    if (!hasCoordinates && !hasLatLng) {
      errors.push('Missing required columns: either "coordinates" OR both "latitude" and "longitude"');
      return { success: false, errors, warnings, rowCount: 0 };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      try {
        const values = parseCSVLine(line);
        const row: Record<string, any> = {};
        
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });

        // Validate and transform row
        const result = validateAndTransformRow(row, i + 1);
        
        if (result.errors.length > 0) {
          errors.push(`Row ${i + 1}: ${result.errors.join('; ')}`);
        } else {
          if (result.warnings.length > 0) {
            warnings.push(`Row ${i + 1}: ${result.warnings.join('; ')}`);
          }
          if (result.data) {
            data.push(result.data);
          }
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (data.length === 0 && errors.length > 0) {
      return { success: false, data: undefined, errors, warnings, rowCount: lines.length - 1 };
    }

    return { 
      success: true, 
      data, 
      errors, 
      warnings, 
      rowCount: lines.length - 1 
    };
  } catch (error) {
    errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors, warnings, rowCount: 0 };
  }
};

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate if URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    // Accept URLs that:
    // 1. End with image file extensions
    // 2. Contain common image hosting domains
    // 3. Are from Firebase, Google Drive, Cloudinary, or similar services
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) !== null || 
           url.includes('firebase') || 
           url.includes('cloudinary') ||
           url.includes('imgur') ||
           url.includes('drive.google') ||
           url.includes('lh3.googleusercontent') ||
           url.includes('photos.google') ||
           url.includes('pbs.twimg') ||
           url.includes('instagram.com') ||
           url.includes('cdn.') ||
           url.includes('/images/') ||
           url.includes('/photos/') ||
           url.includes('/assets/');
  } catch {
    return false;
  }
}

/**
 * Validate and transform a single CSV row
 */
function validateAndTransformRow(
  row: Record<string, any>,
  _rowNumber: number
): {
  data?: NewToiletData & { imageUrls: string[] };
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Required field: name
    const name = row.name?.trim();
    if (!name) {
      errors.push('Name is required');
    }

    // Parse coordinates - support both formats
    let lat = NaN, lng = NaN;
    
    if (row.coordinates?.trim()) {
      // Parse "lat, lng" format
      const coords = row.coordinates.trim().split(',').map((c: string) => parseFloat(c.trim()));
      if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        errors.push('Coordinates must be in format: "latitude, longitude"');
      } else {
        lat = coords[0];
        lng = coords[1];
      }
    } else {
      // Parse latitude and longitude separately
      lat = parseFloat(row.latitude);
      lng = parseFloat(row.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        errors.push('Latitude and longitude must be valid numbers');
      }
    }

    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    if (errors.length > 0) {
      return { errors, warnings };
    }

    // Optional fields with defaults
    const type = (row.type?.toLowerCase() || 'public') as 'public' | 'commercial' | 'event';
    if (!['public', 'commercial', 'event'].includes(type)) {
      warnings.push(`Invalid type "${row.type}", using "public"`);
    }

    const gender = (row.gender?.toLowerCase() || 'unisex') as 'unisex' | 'separated';
    if (!['unisex', 'separated'].includes(gender)) {
      warnings.push(`Invalid gender "${row.gender}", using "unisex"`);
    }

    const priceType = (row.price_type?.toLowerCase() || 'free') as 'free' | 'paid';
    if (!['free', 'paid'].includes(priceType)) {
      warnings.push(`Invalid price_type "${row.price_type}", using "free"`);
    }

    const priceAmount = priceType === 'paid' ? parseInt(row.price_amount) || 0 : 0;

    const accessibility = row.accessibility === true || 
                         row.accessibility === 'true' || 
                         row.accessibility === '1' ||
                         row.accessibility?.toLowerCase() === 'true';

    const amenitiesStr = row.amenities?.trim() || '';
    const amenities = amenitiesStr
      .split(',')
      .map((a: string) => a.trim().toLowerCase())
      .filter((a: string) => ['paper', 'bidet', 'sink', 'soap', 'mirror', 'dryer', 'baby'].includes(a));

    // Collect image URLs
    const imageUrls: string[] = [];
    [row.image_url1, row.image_url2, row.image_url3]
      .filter((url: string | undefined) => url && url.trim())
      .forEach((url: string | undefined) => {
        const trimmedUrl = url?.trim();
        if (trimmedUrl && isValidImageUrl(trimmedUrl)) {
          imageUrls.push(trimmedUrl);
        } else if (trimmedUrl) {
          warnings.push(`Invalid image URL: "${trimmedUrl}"`);
        }
      });

    if (imageUrls.length === 0) {
      warnings.push('Không có hình ảnh nào. Vui lòng thêm image_url1, image_url2 hoặc image_url3');
    } else if (imageUrls.length > 3) {
      warnings.push('Tối đa 3 hình ảnh, những hình ảnh thứ 4 trở đi sẽ bị bỏ qua');
      imageUrls.splice(3);
    }

    const data: NewToiletData & { imageUrls: string[] } = {
      name,
      address: row.address?.trim() || '',
      location: { lat, lng },
      type: type as 'public' | 'commercial' | 'event',
      gender: gender as 'unisex' | 'separated',
      price_type: priceType as 'free' | 'paid',
      price_amount: priceAmount,
      accessibility,
      amenities,
      images: [],
      imageUrls
    };

    return { data, errors, warnings };
  } catch (error) {
    errors.push(`Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { errors, warnings };
  }
}

/**
 * Generate a CSV template for bulk import
 */
export const generateCSVTemplate = (): string => {
  const headers = [
    'name',
    'address',
    'coordinates',
    'type',
    'gender',
    'price_type',
    'price_amount',
    'accessibility',
    'amenities',
    'image_url1',
    'image_url2',
    'image_url3'
  ].join(',');

  // Helper to quote CSV values that contain special characters
  const quote = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const examples = [
    [
      'WC Công viên Thống Nhất',
      '254 Lê Duẩn, Đống Đa, Hà Nội',
      '21.031780309611218, 105.85214015945157',
      'public',
      'unisex',
      'free',
      '0',
      'true',
      'paper,bidet,soap,dryer',
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      ''
    ].map(quote).join(','),
    [
      'WC Trung tâm thương mại',
      '72 Lê Thánh Tôn, Quận 1, TP.HCM',
      '10.7769204, 106.7009206',
      'commercial',
      'separated',
      'paid',
      '5000',
      'true',
      'paper,soap,mirror,baby',
      'https://example.com/image3.jpg',
      '',
      ''
    ].map(quote).join(',')
  ];

  return [headers, ...examples].join('\n');
};

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
  const csv = generateCSVTemplate();
  // Add UTF-8 BOM to ensure proper encoding in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'toilet_bulk_import_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
