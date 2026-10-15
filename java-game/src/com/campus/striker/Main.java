package com.campus.striker;

import javax.swing.SwingUtilities;

/**
 * Campus Striker: Anime Fighting & Tactical Sniper Arena
 * Pure Java Standard Edition (Swing & AWT).
 * Zero third-party game frameworks/engines.
 */
public class Main {
    public static void main(String[] args) {
        // Enforce thread safety by initializing Swing UI on Event Dispatch Thread (EDT)
        SwingUtilities.invokeLater(() -> {
            GameFrame frame = new GameFrame();
            frame.setVisible(true);
        });
    }
}
