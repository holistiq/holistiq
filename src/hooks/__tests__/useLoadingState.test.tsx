/**
 * Unit tests for the useLoadingState hook
 */
import { renderHook, act } from "@testing-library/react-hooks";
import { useLoadingState, LoadingStatus } from "../useLoadingState";

// Mock timers for testing timeouts
jest.useFakeTimers();

describe("useLoadingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should initialize with IDLE state", () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.status).toBe(LoadingStatus.IDLE);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should transition to LOADING state when executing a promise", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState());

    // Create a promise that resolves after a delay
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("test data"), 100);
    });

    // Execute the promise
    act(() => {
      result.current.execute(promise);
    });

    // Check that the state is now LOADING
    expect(result.current.status).toBe(LoadingStatus.LOADING);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isIdle).toBe(false);

    // Fast-forward time to resolve the promise
    jest.advanceTimersByTime(100);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Check that the state is now SUCCESS
    expect(result.current.status).toBe(LoadingStatus.SUCCESS);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe("test data");
  });

  it("should transition to ERROR state when a promise rejects", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useLoadingState());

    // Create a promise that rejects after a delay
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("test error")), 100);
    });

    // Execute the promise and catch the error to prevent test failure
    act(() => {
      result.current.execute(promise).catch(() => {});
    });

    // Check that the state is now LOADING
    expect(result.current.status).toBe(LoadingStatus.LOADING);

    // Fast-forward time to reject the promise
    jest.advanceTimersByTime(100);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Check that the state is now ERROR
    expect(result.current.status).toBe(LoadingStatus.ERROR);
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("test error");
  });

  it("should transition to TIMEOUT state when a promise takes too long", async () => {
    // Mock the onTimeout callback
    const onTimeout = jest.fn();

    const { result, waitForNextUpdate } = renderHook(() =>
      useLoadingState({ timeout: 500, onTimeout }),
    );

    // Create a promise that never resolves
    const promise = new Promise<string>(() => {
      // This promise never resolves or rejects
    });

    // Execute the promise
    act(() => {
      result.current.execute(promise).catch(() => {});
    });

    // Check that the state is now LOADING
    expect(result.current.status).toBe(LoadingStatus.LOADING);

    // Fast-forward time past the timeout
    jest.advanceTimersByTime(600);

    // Wait for the hook to update
    await waitForNextUpdate();

    // Check that the state is now TIMEOUT
    expect(result.current.status).toBe(LoadingStatus.TIMEOUT);
    expect(result.current.isTimeout).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Check that the onTimeout callback was called
    expect(onTimeout).toHaveBeenCalled();
  });

  it("should support partial data loading", () => {
    const { result } = renderHook(() =>
      useLoadingState<{ name: string; age: number }>(),
    );

    // Set partial data
    act(() => {
      result.current.setPartialData({ name: "John" });
    });

    // Check that the state is now PARTIAL
    expect(result.current.status).toBe(LoadingStatus.PARTIAL);
    expect(result.current.isPartial).toBe(true);
    expect(result.current.data).toEqual({ name: "John" });

    // Set more partial data
    act(() => {
      result.current.setPartialData({ age: 30 });
    });

    // Check that the data is merged
    expect(result.current.data).toEqual({ name: "John", age: 30 });
  });

  it("should reset the state when reset is called", () => {
    const { result } = renderHook(() => useLoadingState());

    // Set success state
    act(() => {
      result.current.setSuccess("test data");
    });

    // Check that the state is SUCCESS
    expect(result.current.status).toBe(LoadingStatus.SUCCESS);
    expect(result.current.data).toBe("test data");

    // Reset the state
    act(() => {
      result.current.reset();
    });

    // Check that the state is back to IDLE
    expect(result.current.status).toBe(LoadingStatus.IDLE);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("should call onSuccess callback when setting success state", () => {
    // Mock the onSuccess callback
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useLoadingState({ onSuccess }));

    // Set success state
    act(() => {
      result.current.setSuccess("test data");
    });

    // Check that the onSuccess callback was called with the data
    expect(onSuccess).toHaveBeenCalledWith("test data");
  });

  it("should call onError callback when setting error state", () => {
    // Mock the onError callback
    const onError = jest.fn();

    const { result } = renderHook(() => useLoadingState({ onError }));

    // Create an error
    const error = new Error("test error");

    // Set error state
    act(() => {
      result.current.setError(error);
    });

    // Check that the onError callback was called with the error
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("should update progress when setProgress is called", () => {
    const { result } = renderHook(() => useLoadingState());

    // Set progress
    act(() => {
      result.current.setProgress(50, "Loading 50%");
    });

    // Check that the progress and message are updated
    expect(result.current.progress).toBe(50);
    expect(result.current.message).toBe("Loading 50%");
  });

  it("should update message when setMessage is called", () => {
    const { result } = renderHook(() => useLoadingState());

    // Set message
    act(() => {
      result.current.setMessage("New message");
    });

    // Check that the message is updated
    expect(result.current.message).toBe("New message");
  });
});
