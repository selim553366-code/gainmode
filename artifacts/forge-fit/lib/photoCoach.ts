export type PhotoCoachRequestStatus = 'success' | 'failed' | 'limited';

type PhotoCoachRequestOptions<T> = {
  photoAnalysesUsed: number;
  limit: number;
  request: () => Promise<T>;
  onStart?: () => void;
  onSuccess: (result: T) => void;
  onError: (error: unknown) => void;
  onLimit: () => void;
};

export async function runPhotoCoachRequest<T>({
  photoAnalysesUsed,
  request,
  onStart,
  onSuccess,
  onError,
  onLimit,
  limit,
}: PhotoCoachRequestOptions<T>): Promise<PhotoCoachRequestStatus> {
  if (photoAnalysesUsed >= limit) {
    onLimit();
    return 'limited';
  }

  onStart?.();
  let result: T;
  try {
    result = await request();
  } catch (error) {
    onError(error);
    return 'failed';
  }
  onSuccess(result);
  return 'success';
}