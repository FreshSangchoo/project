package com.example.donzoom.util;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JWTUtil {

  private final SecretKey secretKey;

  @Value("${jwt.accessToken.expireTime}")
  private Long accessExpired;
  @Value("${jwt.refreshToken.expireTime}")
  private Long refreshExpired;
  @Value("${jwt.oauth.token.expireTime}")
  private Long oAuthExpired;

  public JWTUtil(@Value("${spring.jwt.secret}") String secret) {
    this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
        Jwts.SIG.HS256.key().build().getAlgorithm());
  }

  public String getUsername(String token) {

    return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload()
        .get("username", String.class);
  }

  public String getRole(String token) {

    return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload()
        .get("role", String.class);
  }

  public Boolean isExpired(String token) {
    try {
      Date expirationDate = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token)
          .getPayload().getExpiration();

      boolean isExpired = expirationDate.before(new Date());
      if (isExpired) {
        log.info("Token is expired. Expiration date: {}", expirationDate);
      }
      return isExpired;
    } catch (ExpiredJwtException e) {
      log.warn("Token is already expired", e);
      return true;
    } catch (IllegalArgumentException e) {
      log.error("JWT claims string is empty", e);
      return true;
    } catch (JwtException e) {
      log.error("JWT validation error", e);
      return true;
    } catch (Exception e) {
      log.error("Unexpected error during JWT validation", e);
      return true;
    }
  }

  public String createAccessJwt(String username, String role) {

    return Jwts.builder().claim("username", username).claim("role", role)
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + accessExpired)).signWith(secretKey)
        .compact();
  }

  public String createRefreshJwt(String username, String role) {

    return Jwts.builder().claim("username", username).claim("role", role)
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + refreshExpired)).signWith(secretKey)
        .compact();
  }

  public String createOauthJwt(String username, String role) {

    return Jwts.builder().claim("username", username).claim("role", role)
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + oAuthExpired)).signWith(secretKey)
        .compact();
  }
}