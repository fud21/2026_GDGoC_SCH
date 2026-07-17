package com.gdg.stockmanager.repository;

import com.gdg.stockmanager.domain.AppUser;
import com.gdg.stockmanager.domain.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findByUser(AppUser user);

    boolean existsByUserAndTicker(AppUser user, String ticker);
}
