package com.kalasathi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kalasathi.dto.ApiResponse;
import com.kalasathi.repository.UserRepository;
import com.kalasathi.security.JwtAuthenticationFilter;
import com.kalasathi.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration(proxyBeanMethods = false)
public class SecurityConfiguration {
    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        return new JwtAuthenticationFilter(jwtService, userRepository);
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter,
            ObjectMapper objectMapper) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            String error = (String) request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_ATTRIBUTE);
                            String code = switch (error == null ? "" : error) {
                                case "INVALID_PAYLOAD" -> "INVALID_TOKEN";
                                case "USER_NOT_FOUND" -> "USER_NOT_FOUND";
                                case "INVALID_TOKEN" -> "INVALID_TOKEN";
                                default -> "AUTH_REQUIRED";
                            };
                            String message = switch (code) {
                                case "INVALID_TOKEN" -> "Token expired or invalid";
                                case "USER_NOT_FOUND" -> "User session not found";
                                default -> "Authentication token missing or invalid";
                            };
                            writeError(response, objectMapper, HttpServletResponse.SC_UNAUTHORIZED, code, message);
                        })
                        .accessDeniedHandler((request, response, exception) ->
                                writeError(response, objectMapper, HttpServletResponse.SC_FORBIDDEN,
                                        "FORBIDDEN", "Access forbidden for this account role.")))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/health", "/api/media/**", "/api/auth/register", "/api/auth/login")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/*",
                                "/api/products/*/opportunities").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/opportunities", "/api/orders",
                                "/api/orders/*/payment/verify", "/api/orders/*/payment/sandbox-confirm",
                                "/api/orders/webhook")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/opportunities", "/api/orders/track/**")
                        .permitAll()
                        .requestMatchers("/api/admin/**", "/demo-api/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/products")
                        .hasAnyRole("ARTISAN", "ADMIN")
                        .requestMatchers("/api/products/*/**")
                        .hasAnyRole("ARTISAN", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/orders").hasAnyRole("BUYER", "ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origin}") String frontendOrigin) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    private static void writeError(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            int status,
            String code,
            String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.failure(code, message));
    }
}
