'use server';

import {NextResponse} from 'next/server';
import {extractPassportData} from '@/ai/flows/extract-passport-data';
import {validatePassportData} from '@/ai/flows/validate-passport-data';

export async function GET(request: Request) {
  return NextResponse.json({message: 'Upload a passport image to extract and validate its data using POST request.'});
}

export async function POST(request: Request) {
  try {
    const req = await request.json();
    const {image} = req;

    if (!image) {
      return NextResponse.json({error: 'Image is required'}, {status: 400});
    }

    const extracted = await extractPassportData({photoUrl: image});

    const validation = await validatePassportData({
      fullName: extracted.fullName,
      passportNumber: extracted.passportNumber,
      dateOfBirth: extracted.dateOfBirth,
      expiryDate: extracted.dateOfExpiry,
      issuingCountry: extracted.issuingCountry,
      photoUrl: image,
    });

    return NextResponse.json({extractedData: extracted, validationResults: validation});
  } catch (error: any) {
    console.error('Error during validation:', error);
    return NextResponse.json(
      {error: 'Error during validation', message: error.message || 'Something went wrong.'},
      {status: 500}
    );
  }
}
