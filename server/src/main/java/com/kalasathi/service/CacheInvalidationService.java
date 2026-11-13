package com.kalasathi.service;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CacheInvalidationService {
    private static final Logger logger = LoggerFactory.getLogger(CacheInvalidationService.class);

    public static final String PRODUCT_LIST = "products";
    public static final String PRODUCT_DETAIL = "product";
    public static final String PRODUCT_OPPORTUNITIES = "productOpportunities";
    public static final String OPPORTUNITIES = "opportunities";
    public static final String DASHBOARD_SUMMARY = "dashboardSummary";
    public static final String ADMIN_PRODUCTS = "adminProducts";
    public static final String ARTISAN_PROFIT = "artisanProfit";
    public static final String DASHBOARD_INSIGHTS = "dashboardInsights";

    private final CacheManager cacheManager;

    public CacheInvalidationService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public void productChanged(String productId) {
        afterCommit(() -> invalidateProduct(productId));
    }

    public void productDeleted(String productId) {
        afterCommit(() -> {
            invalidateProduct(productId);
            evict(PRODUCT_OPPORTUNITIES, productId);
            clear(OPPORTUNITIES);
        });
    }

    public void opportunityChanged(String productId) {
        afterCommit(() -> {
            invalidateProduct(productId);
            evict(PRODUCT_OPPORTUNITIES, productId);
            clear(OPPORTUNITIES);
        });
    }

    public void ordersChanged() {
        afterCommit(() -> clear(ARTISAN_PROFIT));
    }

    private void invalidateProduct(String productId) {
        clear(PRODUCT_LIST);
        evict(PRODUCT_DETAIL, productId);
        clear(ADMIN_PRODUCTS);
        clear(DASHBOARD_SUMMARY);
    }

    private void afterCommit(Runnable invalidation) {
        Runnable guardedInvalidation = () -> {
            try {
                invalidation.run();
            } catch (RuntimeException exception) {
                logger.error("Cache invalidation failed after a data change.", exception);
                throw new IllegalStateException("Data was saved, but cache invalidation failed.", exception);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    guardedInvalidation.run();
                }
            });
        } else {
            guardedInvalidation.run();
        }
    }

    private void clear(String cacheName) {
        cache(cacheName).clear();
    }

    private void evict(String cacheName, Object key) {
        cache(cacheName).evict(key);
    }

    private Cache cache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) {
            throw new IllegalStateException("Cache is not configured: " + cacheName);
        }
        return cache;
    }
}
