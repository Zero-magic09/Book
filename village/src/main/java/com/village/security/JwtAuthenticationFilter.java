package com.village.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        System.out.println("Filter: Processing " + request.getMethod() + " " + request.getRequestURI());
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String phone;

        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            if (jwtUtils.isTokenValid(jwt)) {
                phone = jwtUtils.extractPhone(jwt);
                String role = jwtUtils.extractClaim(jwt, claims -> claims.get("role", String.class));
                Long userId = jwtUtils.extractUserId(jwt);

                if (phone != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId, // Principal is the userId
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("Token authenticated for user: " + phone + " [ID: " + userId + "] with role: " + role);
                }
            } else {
                System.err.println("Token is invalid: " + jwt);
            }
        } catch (Exception e) {
            System.err.println("JWT Auth error for path " + request.getRequestURI() + ": " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
