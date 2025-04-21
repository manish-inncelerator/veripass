"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { extractPassportData, ExtractPassportDataOutput } from "@/ai/flows/extract-passport-data";
import { validatePassportData, ValidatePassportDataOutput } from "@/ai/flows/validate-passport-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractPassportDataOutput | null>(null);
  const [validationResults, setValidationResults] = useState<ValidatePassportDataOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtractedData(null);
    setValidationResults(null);
    const file = e.target.files?.[0];
    if (!file) {
      setImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleValidation = async () => {
    if (!image) {
      toast({
        title: "Please upload an image first.",
      });
      return;
    }

    setLoading(true);
    try {
      const extracted = await extractPassportData({ photoUrl: image });
      setExtractedData(extracted);

      const validation = await validatePassportData({
        fullName: extracted.fullName,
        passportNumber: extracted.passportNumber,
        dateOfBirth: extracted.dateOfBirth,
        expiryDate: extracted.dateOfExpiry,
        issuingCountry: extracted.issuingCountry,
        photoUrl: image,
      });
      setValidationResults(validation);
    } catch (error: any) {
      console.error("Error during validation:", error);
      toast({
        title: "Error during validation",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">VeriPass</h1>
      <Card className="w-full max-w-2xl p-4 rounded-lg shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">Passport Verification</CardTitle>
          <CardDescription className="text-sm text-gray-500">Upload a passport image to extract and validate its data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md border-gray-400">
            <label htmlFor="image-upload" className="cursor-pointer">
              {image ? (
                <img src={image} alt="Passport Preview" className="max-h-60 rounded-md object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Icons.file className="w-10 h-10 text-gray-500" />
                  <p className="text-gray-600">Click to upload or drag and drop an image</p>
                </div>
              )}
              <Input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <Button className="w-full" onClick={handleValidation} disabled={loading}>
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Validate Passport"
            )}
          </Button>
        </CardContent>
      </Card>

      {extractedData && validationResults && (
        <Card className="w-full max-w-2xl mt-6 p-4 rounded-lg shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">Validation Results</CardTitle>
            <CardDescription className="text-sm text-gray-500">Review the extracted data and validation status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-4">
                <div className="text-gray-600 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-gray-800">{value}</div>
                {validationResults && validationResults[key as keyof ValidatePassportDataOutput] && (
                  <ValidationAlert field={key} result={validationResults[key as keyof ValidatePassportDataOutput]} />
                )}
              </div>
            ))}
            <Alert className={cn("mt-4", validationResults.overallValidity ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500")}>
              {validationResults.overallValidity ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <AlertTitle className="text-green-700">Passport is Valid</AlertTitle>
                  <AlertDescription className="text-green-600">All fields have passed validation checks.</AlertDescription>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  <AlertTitle className="text-red-700">Passport is Invalid</AlertTitle>
                  <AlertDescription className="text-red-600">Some fields have failed validation checks.</AlertDescription>
                </>
              )}
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ValidationAlert({ field, result }: { field: string; result: any }) {
  if (!result) return null;

  let icon = null;
  let title = "";
  let description = "";
  let className = "";

  if (result.isValid && !result.isSuspicious) {
    icon = <CheckCircle className="h-4 w-4 mr-2 text-teal-500" />;
    title = `${field} is Valid`;
    description = "This field has passed validation checks.";
    className = "bg-teal-50 border-teal-500";
  } else if (result.isSuspicious) {
    icon = <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />;
    title = `${field} is Suspicious`;
    description = result.reason || "This field requires further review.";
    className = "bg-yellow-50 border-yellow-500";
  } else {
    icon = <XCircle className="h-4 w-4 mr-2 text-red-500" />;
    title = `${field} is Invalid`;
    description = result.reason || "This field has failed validation checks.";
    className = "bg-red-50 border-red-500";
  }

  return (
    <Alert className={cn("mt-2", className)}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
