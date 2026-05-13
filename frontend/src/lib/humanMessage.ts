const messages: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: '로그인 정보가 올바르지 않습니다',
  AUTH_TOO_MANY_ATTEMPTS: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요',
  AUTH_TOKEN_EXPIRED: '로그인 세션이 만료되었습니다. 다시 로그인해주세요',
  AUTH_TOKEN_INVALID: '인증이 만료되었습니다. 다시 로그인해주세요',
  VALIDATION_FAILED: '입력값을 확인해주세요',
  NETWORK_ERROR: '네트워크 오류. 연결을 확인해주세요',
  NETWORK_TIMEOUT: '서버 응답이 지연됩니다. 잠시 후 다시 시도해주세요',
  INTERNAL_ERROR: '서버에 일시적인 문제가 발생했습니다',
};

export function humanMessage(code: string, fallback?: string): string {
  return messages[code] ?? fallback ?? '오류가 발생했습니다';
}
