'use server';

import {NextResponse} from 'next/server';
import {extractPassportData} from '@/ai/flows/extract-passport-data';
import {validatePassportData} from '@/ai/flows/validate-passport-data';

async function isPDFData(data: string): Promise<boolean> {
  // Check if the data string starts with the PDF header
  return data.startsWith('%PDF-');
}

export async function GET(request: Request) {
  return NextResponse.json({message: 'Upload a passport image or PDF to extract and validate its data using POST request.'});
}

export async function POST(request: Request) {
  try {
    const req = await request.json();
    const {image} = req;

    if (!image) {
      return NextResponse.json({error: 'Image is required'}, {status: 400});
    }

    const isPDF = await isPDFData(image);

    const extracted = await extractPassportData({
      type: isPDF ? 'pdf' : 'image',
      data: image,
    });

    const validation = await validatePassportData({
      fullName: extracted.fullName,
      passportNumber: extracted.passportNumber,
      dateOfBirth: extracted.dateOfBirth,
      expiryDate: extracted.dateOfExpiry,
      issuingCountry: extracted.issuingCountry,
      photoUrl: image,
    });

    return NextResponse.json({
      isPDF: isPDF,
      extractedData: extracted,
      validationResults: validation,
      passportData: image, // Include the passport data
    });
  } catch (error: any) {
    console.error('Error during validation:', error);
    return NextResponse.json(
      {error: 'Error during validation', message: error.message || 'Something went wrong.'},
      {status: 500}
    );
  }
}
