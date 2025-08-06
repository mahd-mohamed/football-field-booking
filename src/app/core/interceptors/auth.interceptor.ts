import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔐 AuthInterceptor: Processing request to:', req.url);

  const excludedUrls = [
    '/api/auth/login',
    '/api/auth/register'
  ];

  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  if (isExcluded) {
    console.log('🔐 AuthInterceptor: Excluded URL, passing through without token');
    return next(req);
  }

  const token = sessionStorage.getItem('jwt_token');

  if (token) {
    console.log('🔐 AuthInterceptor: Adding Authorization header with token');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  } else {
    console.log('🔐 AuthInterceptor: No token found, passing through without Authorization header');
  }

  return next(req);
};
