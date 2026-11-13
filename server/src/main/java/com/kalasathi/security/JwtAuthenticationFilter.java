package com.kalasathi.security;

import com.kalasathi.entity.UserEntity;
import com.kalasathi.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String AUTH_ERROR_ATTRIBUTE = JwtAuthenticationFilter.class.getName() + ".authError";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String userId;
            try {
                userId = jwtService.subjectUserId(header.substring(7));
            } catch (JwtException exception) {
                request.setAttribute(AUTH_ERROR_ATTRIBUTE, "INVALID_TOKEN");
                filterChain.doFilter(request, response);
                return;
            } catch (IllegalArgumentException exception) {
                request.setAttribute(AUTH_ERROR_ATTRIBUTE, "INVALID_PAYLOAD");
                filterChain.doFilter(request, response);
                return;
            }
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                request.setAttribute(AUTH_ERROR_ATTRIBUTE, "USER_NOT_FOUND");
            } else {
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user.getId(),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                request.setAttribute("authenticatedUser", user);
            }
        }
        filterChain.doFilter(request, response);
    }
}
