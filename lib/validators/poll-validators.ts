/**
 * Poll validation utilities
 */

import { AppConfig } from '../config/app-config';
import { ValidationError, InvalidInputError } from '../errors/custom-errors';
import type { CreatePollFormData, EditPollFormData } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Base validator class
 */
export abstract class BaseValidator {
  protected errors: Record<string, string[]> = {};
  
  protected addError(field: string, message: string) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }
  
  protected hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
  
  protected getResult(): ValidationResult {
    return {
      isValid: !this.hasErrors(),
      errors: this.errors,
    };
  }
  
  protected reset() {
    this.errors = {};
  }
}

/**
 * Poll validators
 */
export class PollValidators extends BaseValidator {
  /**
   * Validate poll title
   */
  static validateTitle(title: string | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (!title) {
      errors.push('Title is required');
    } else {
      const trimmed = title.trim();
      if (!trimmed) {
        errors.push('Title cannot be empty');
      } else if (trimmed.length > AppConfig.poll.maxTitleLength) {
        errors.push(`Title cannot exceed ${AppConfig.poll.maxTitleLength} characters`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate poll description
   */
  static validateDescription(description: string | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (description && description.trim().length > AppConfig.poll.maxDescriptionLength) {
      errors.push(`Description cannot exceed ${AppConfig.poll.maxDescriptionLength} characters`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate poll options
   */
  static validateOptions(options: string[] | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (!options || !Array.isArray(options)) {
      errors.push('Options are required');
      return { isValid: false, errors };
    }
    
    // Filter out empty options
    const validOptions = options.filter(option => option && option.trim());
    
    if (validOptions.length < AppConfig.poll.minOptions) {
      errors.push(`At least ${AppConfig.poll.minOptions} options are required`);
    }
    
    if (validOptions.length > AppConfig.poll.maxOptions) {
      errors.push(`Maximum ${AppConfig.poll.maxOptions} options allowed`);
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(option => option.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('Duplicate options are not allowed');
    }
    
    // Validate individual options
    validOptions.forEach((option, index) => {
      const trimmed = option.trim();
      if (trimmed.length === 0) {
        errors.push(`Option ${index + 1} cannot be empty`);
      } else if (trimmed.length > 200) {
        errors.push(`Option ${index + 1} cannot exceed 200 characters`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate expiration date
   */
  static validateExpirationDate(expiresAt: Date | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (expiresAt) {
      const now = new Date();
      if (expiresAt <= now) {
        errors.push('Expiration date must be in the future');
      }
      
      // Check if expiration is too far in the future (e.g., more than 1 year)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (expiresAt > oneYearFromNow) {
        errors.push('Expiration date cannot be more than 1 year in the future');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate create poll form data
   */
  static validateCreatePoll(data: CreatePollFormData): ValidationResult {
    const validator = new PollValidators();
    validator.reset();
    
    // Validate title
    const titleResult = this.validateTitle(data.title);
    if (!titleResult.isValid) {
      titleResult.errors.forEach(error => validator.addError('title', error));
    }
    
    // Validate description
    const descriptionResult = this.validateDescription(data.description);
    if (!descriptionResult.isValid) {
      descriptionResult.errors.forEach(error => validator.addError('description', error));
    }
    
    // Validate options
    const optionsResult = this.validateOptions(data.options);
    if (!optionsResult.isValid) {
      optionsResult.errors.forEach(error => validator.addError('options', error));
    }
    
    // Validate expiration date
    const expirationResult = this.validateExpirationDate(data.expiresAt);
    if (!expirationResult.isValid) {
      expirationResult.errors.forEach(error => validator.addError('expiresAt', error));
    }
    
    return validator.getResult();
  }
  
  /**
   * Validate edit poll form data
   */
  static validateEditPoll(data: Partial<EditPollFormData>): ValidationResult {
    const validator = new PollValidators();
    validator.reset();
    
    // Only validate fields that are present
    if (data.title !== undefined) {
      const titleResult = this.validateTitle(data.title);
      if (!titleResult.isValid) {
        titleResult.errors.forEach(error => validator.addError('title', error));
      }
    }
    
    if (data.description !== undefined) {
      const descriptionResult = this.validateDescription(data.description);
      if (!descriptionResult.isValid) {
        descriptionResult.errors.forEach(error => validator.addError('description', error));
      }
    }
    
    if (data.expiresAt !== undefined) {
      const expirationResult = this.validateExpirationDate(data.expiresAt);
      if (!expirationResult.isValid) {
        expirationResult.errors.forEach(error => validator.addError('expiresAt', error));
      }
    }
    
    return validator.getResult();
  }
  
  /**
   * Validate vote submission
   */
  static validateVoteSubmission(
    optionIds: string[],
    allowMultipleVotes: boolean
  ): ValidationResult {
    const validator = new PollValidators();
    validator.reset();
    
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      validator.addError('optionIds', 'At least one option must be selected');
    } else {
      // Check for duplicate option IDs
      const uniqueOptions = new Set(optionIds);
      if (uniqueOptions.size !== optionIds.length) {
        validator.addError('optionIds', 'Duplicate option selections are not allowed');
      }
      
      // Check multiple votes constraint
      if (!allowMultipleVotes && optionIds.length > 1) {
        validator.addError('optionIds', 'This poll only allows one vote per user');
      }
      
      // Validate option ID format (assuming UUIDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      optionIds.forEach((optionId, index) => {
        if (!optionId || typeof optionId !== 'string') {
          validator.addError('optionIds', `Option ${index + 1} ID is invalid`);
        } else if (!uuidRegex.test(optionId)) {
          validator.addError('optionIds', `Option ${index + 1} ID format is invalid`);
        }
      });
    }
    
    return validator.getResult();
  }
  
  /**
   * Validate poll ID
   */
  static validatePollId(pollId: string | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (!pollId) {
      errors.push('Poll ID is required');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pollId)) {
        errors.push('Invalid poll ID format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate user ID
   */
  static validateUserId(userId: string | undefined): FieldValidationResult {
    const errors: string[] = [];
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        errors.push('Invalid user ID format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validation helper functions
 */
export function validateAndThrowPoll(data: CreatePollFormData): void {
  const result = PollValidators.validateCreatePoll(data);
  if (!result.isValid) {
    throw ValidationError.fromFieldErrors(result.errors);
  }
}

export function validateAndThrowEditPoll(data: Partial<EditPollFormData>): void {
  const result = PollValidators.validateEditPoll(data);
  if (!result.isValid) {
    throw ValidationError.fromFieldErrors(result.errors);
  }
}

export function validateAndThrowVote(
  optionIds: string[],
  allowMultipleVotes: boolean
): void {
  const result = PollValidators.validateVoteSubmission(optionIds, allowMultipleVotes);
  if (!result.isValid) {
    throw ValidationError.fromFieldErrors(result.errors);
  }
}

export function validateAndThrowPollId(pollId: string | undefined): void {
  const result = PollValidators.validatePollId(pollId);
  if (!result.isValid) {
    throw new InvalidInputError('pollId', pollId, result.errors.join(', '));
  }
}

export function validateAndThrowUserId(userId: string | undefined): void {
  const result = PollValidators.validateUserId(userId);
  if (!result.isValid) {
    throw new InvalidInputError('userId', userId, result.errors.join(', '));
  }
}
