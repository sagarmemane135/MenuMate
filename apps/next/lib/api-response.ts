/**
 * Standardized API response utilities
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 200 }
  );
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 201 }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  message?: string,
  details?: unknown
): NextResponse<ApiError> {
  const response: ApiError = { error };
  if (message) {
    response.message = message;
  }
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  errors: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: "Validation error",
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
  message: string = "Unauthorized"
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message,
    },
    { status: 401 }
  );
}

/**
 * Create a not found response
 */
export function notFoundResponse(
  message: string = "Resource not found"
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: "Not Found",
      message,
    },
    { status: 404 }
  );
}

/**
 * Create an internal server error response
 */
export function internalErrorResponse(
  message: string = "Internal server error"
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: "Internal Server Error",
      message,
    },
    { status: 500 }
  );
}

