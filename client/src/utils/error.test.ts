import axios from 'axios';
import { getErrorMessage } from './error';

describe('getErrorMessage', () => {
  // -----------------------------------------------------------------------
  // Axios errors — we spy on axios.isAxiosError to control detection
  // -----------------------------------------------------------------------

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns response.data.error when it is an Axios error with data.error', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const err = {
      isAxiosError: true,
      response: { data: { error: 'Validation failed' } },
      message: 'Request failed with status code 400',
    };

    expect(getErrorMessage(err)).toBe('Validation failed');
  });

  it('returns response.data.message when data.error is absent', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const err = {
      isAxiosError: true,
      response: { data: { message: 'Not found' } },
      message: 'Request failed with status code 404',
    };

    expect(getErrorMessage(err)).toBe('Not found');
  });

  it('returns err.message when response.data has neither error nor message', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const err = {
      isAxiosError: true,
      response: { data: {} },
      message: 'Network Error',
    };

    expect(getErrorMessage(err)).toBe('Network Error');
  });

  it('returns err.message when response is undefined (network error)', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const err = {
      isAxiosError: true,
      response: undefined,
      message: 'Network Error',
    };

    expect(getErrorMessage(err)).toBe('Network Error');
  });

  it('returns err.message when response.data is undefined', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const err = {
      isAxiosError: true,
      response: { data: undefined },
      message: 'Request failed',
    };

    expect(getErrorMessage(err)).toBe('Request failed');
  });

  // -----------------------------------------------------------------------
  // Regular Error objects
  // -----------------------------------------------------------------------

  it('returns the message from a regular Error instance', () => {
    const err = new Error('Something went wrong');
    expect(getErrorMessage(err)).toBe('Something went wrong');
  });

  it('returns the message from a TypeError', () => {
    const err = new TypeError('Cannot read property of undefined');
    expect(getErrorMessage(err)).toBe('Cannot read property of undefined');
  });

  // -----------------------------------------------------------------------
  // Non-Error / unknown types
  // -----------------------------------------------------------------------

  it('returns default message for a plain string', () => {
    expect(getErrorMessage('some string error')).toBe('An unexpected error occurred');
  });

  it('returns default message for null', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('returns default message for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('returns default message for a number', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
  });

  it('returns default message for a plain object without Error prototype', () => {
    expect(getErrorMessage({ code: 500 })).toBe('An unexpected error occurred');
  });
});
