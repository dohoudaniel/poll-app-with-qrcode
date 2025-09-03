/**
 * Base repository class with common database operations
 */

import { supabase } from '../supabase';
import { Logger } from '../utils/logger';
import { DatabaseError, NotFoundError, convertSupabaseError } from '../errors/custom-errors';
import { measurePerformance } from '../utils/logger';

export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Base repository class
 */
export abstract class BaseRepository<T = any> {
  protected abstract tableName: string;
  protected defaultSelect = '*';
  
  /**
   * Get table reference
   */
  protected get table() {
    return supabase.from(this.tableName);
  }
  
  /**
   * Handle database errors
   */
  protected handleError(error: any, operation: string): never {
    Logger.database(operation, this.tableName, undefined, {
      error: error.message,
      code: error.code,
    });
    
    throw convertSupabaseError(error);
  }
  
  /**
   * Execute query with error handling
   */
  protected async executeQuery<R>(
    queryBuilder: any,
    operation: string,
    expectSingle = false
  ): Promise<R> {
    const startTime = Date.now();
    
    try {
      const { data, error } = expectSingle 
        ? await queryBuilder.single()
        : await queryBuilder;
      
      const duration = Date.now() - startTime;
      Logger.database(operation, this.tableName, duration, {
        expectSingle,
        resultCount: Array.isArray(data) ? data.length : data ? 1 : 0,
      });
      
      if (error) {
        this.handleError(error, operation);
      }
      
      return data as R;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.database(`${operation} (failed)`, this.tableName, duration, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(
        `${operation} failed on ${this.tableName}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Find record by ID
   */
  @measurePerformance('repository.findById')
  async findById(id: string, select?: string): Promise<T | null> {
    const query = this.table
      .select(select || this.defaultSelect)
      .eq('id', id);
    
    try {
      const result = await this.executeQuery<T>(query, 'findById', true);
      return result;
    } catch (error) {
      if (error instanceof DatabaseError && error.originalError?.message?.includes('PGRST116')) {
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Find record by ID or throw
   */
  async findByIdOrThrow(id: string, select?: string): Promise<T> {
    const result = await this.findById(id, select);
    
    if (!result) {
      throw new NotFoundError(this.tableName, id);
    }
    
    return result;
  }
  
  /**
   * Find all records
   */
  @measurePerformance('repository.findAll')
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    let query = this.table.select(options.select || this.defaultSelect);
    
    // Apply ordering
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      });
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
    }
    
    return this.executeQuery<T[]>(query, 'findAll');
  }
  
  /**
   * Find records with pagination
   */
  @measurePerformance('repository.findPaginated')
  async findPaginated(
    pagination: PaginationOptions,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedResult<T>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    // Get total count
    const { count } = await this.table
      .select('*', { count: 'exact', head: true });
    
    const total = count || 0;
    
    // Get paginated data
    const data = await this.findAll({
      ...options,
      limit,
      offset,
    });
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  
  /**
   * Find records by field
   */
  @measurePerformance('repository.findBy')
  async findBy(
    field: string,
    value: any,
    options: QueryOptions = {}
  ): Promise<T[]> {
    let query = this.table
      .select(options.select || this.defaultSelect)
      .eq(field, value);
    
    // Apply ordering
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      });
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return this.executeQuery<T[]>(query, `findBy.${field}`);
  }
  
  /**
   * Find one record by field
   */
  async findOneBy(field: string, value: any, select?: string): Promise<T | null> {
    const results = await this.findBy(field, value, { select, limit: 1 });
    return results[0] || null;
  }
  
  /**
   * Create new record
   */
  @measurePerformance('repository.create')
  async create(data: Partial<T>): Promise<T> {
    const query = this.table
      .insert(data)
      .select(this.defaultSelect);
    
    return this.executeQuery<T>(query, 'create', true);
  }
  
  /**
   * Create multiple records
   */
  @measurePerformance('repository.createMany')
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const query = this.table
      .insert(data)
      .select(this.defaultSelect);
    
    return this.executeQuery<T[]>(query, 'createMany');
  }
  
  /**
   * Update record by ID
   */
  @measurePerformance('repository.update')
  async update(id: string, data: Partial<T>): Promise<T> {
    const query = this.table
      .update(data)
      .eq('id', id)
      .select(this.defaultSelect);
    
    return this.executeQuery<T>(query, 'update', true);
  }
  
  /**
   * Update records by field
   */
  @measurePerformance('repository.updateBy')
  async updateBy(field: string, value: any, data: Partial<T>): Promise<T[]> {
    const query = this.table
      .update(data)
      .eq(field, value)
      .select(this.defaultSelect);
    
    return this.executeQuery<T[]>(query, `updateBy.${field}`);
  }
  
  /**
   * Delete record by ID
   */
  @measurePerformance('repository.delete')
  async delete(id: string): Promise<void> {
    const query = this.table.delete().eq('id', id);
    
    await this.executeQuery(query, 'delete');
  }
  
  /**
   * Delete records by field
   */
  @measurePerformance('repository.deleteBy')
  async deleteBy(field: string, value: any): Promise<void> {
    const query = this.table.delete().eq(field, value);
    
    await this.executeQuery(query, `deleteBy.${field}`);
  }
  
  /**
   * Count records
   */
  @measurePerformance('repository.count')
  async count(field?: string, value?: any): Promise<number> {
    let query = this.table.select('*', { count: 'exact', head: true });
    
    if (field && value !== undefined) {
      query = query.eq(field, value);
    }
    
    const { count } = await this.executeQuery<{ count: number }>(query, 'count');
    return count || 0;
  }
  
  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id, 'id');
    return !!result;
  }
  
  /**
   * Check if record exists by field
   */
  async existsBy(field: string, value: any): Promise<boolean> {
    const results = await this.findBy(field, value, { select: 'id', limit: 1 });
    return results.length > 0;
  }
  
  /**
   * Upsert record (insert or update)
   */
  @measurePerformance('repository.upsert')
  async upsert(data: Partial<T>, conflictColumns?: string[]): Promise<T> {
    let query = this.table
      .upsert(data, { 
        onConflict: conflictColumns?.join(','),
        ignoreDuplicates: false 
      })
      .select(this.defaultSelect);
    
    return this.executeQuery<T>(query, 'upsert', true);
  }
}
