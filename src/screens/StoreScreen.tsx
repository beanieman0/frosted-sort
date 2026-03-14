import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { TubeSkin } from '../context/SettingsContext';

interface StoreScreenProps {
  onBack: () => void;
}

export function StoreScreen({ onBack }: StoreScreenProps) {
  const { colors } = useSettings();
  const { gameState, purchaseSkin, spendCoins, unlockBackgroundSkin, unlockLiquidSkin } = useGame();
  
  const [selectedTab, setSelectedTab] = useState<'tube' | 'liquid' | 'background'>('tube');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  
  // Define available skins for each category
  const tubeSkins: { 
    id: TubeSkin; 
    name: string; 
    price: number; 
    isPremium: boolean; 
    description: string;
    previewColor: string;
  }[] = [
    { id: 'default', name: 'Classic', price: 0, isPremium: false, description: 'The original frosted glass look', previewColor: '#E8F4FD' },
    { id: 'neon', name: 'Neon', price: 500, isPremium: true, description: 'Vibrant glowing tubes', previewColor: '#ff00ff' },
    { id: 'icy', name: 'Icy', price: 300, isPremium: false, description: 'Cool blue frosted tubes', previewColor: '#c8f0ff' },
    { id: 'golden', name: 'Golden', price: 800, isPremium: true, description: 'Luxurious gold-plated tubes', previewColor: '#ffd700' },
    { id: 'pastel', name: 'Pastel', price: 200, isPremium: false, description: 'Soft and soothing colors', previewColor: '#ffb6c1' },
    { id: 'crystal', name: 'Crystal', price: 1000, isPremium: true, description: 'Sparkling crystal clear tubes', previewColor: '#c8ffff' },
    { id: 'lava', name: 'Lava', price: 1200, isPremium: true, description: 'Hot molten rock tubes', previewColor: '#ff6400' },
    { id: 'ocean', name: 'Ocean', price: 700, isPremium: false, description: 'Deep sea blue tubes', previewColor: '#0064ff' },
    { id: 'forest', name: 'Forest', price: 900, isPremium: true, description: 'Enchanted forest green tubes', previewColor: '#009600' },
    { id: 'space', name: 'Space', price: 1500, isPremium: true, description: 'Galactic nebula tubes', previewColor: '#320064' }
  ];
  
  // Define liquid skins (color mappings)
  const liquidColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607', 
    '#8338EC', '#3A86FF', '#06D6A0', '#118AB2', '#073B4C'
  ];
  
  const liquidSkins = [
    { id: 'default', name: 'Standard', price: 0, isPremium: false, description: 'Basic liquid colors', previewColor: '#FF6B6B' },
    { id: 'glitter', name: 'Glitter', price: 150, isPremium: false, description: 'Sparkling glitter effect', previewColor: '#FFD700' },
    { id: 'metallic', name: 'Metallic', price: 300, isPremium: true, description: 'Shiny metallic finish', previewColor: '#C0C0C0' },
    { id: 'neon', name: 'Neon', price: 200, isPremium: false, description: 'Glowing neon liquids', previewColor: '#39FF14' },
    { id: 'pastel', name: 'Pastel', price: 100, isPremium: false, description: 'Soft pastel shades', previewColor: '#FFB6C1' },
    { id: 'rainbow', name: 'Rainbow', price: 500, isPremium: true, description: 'Cycling rainbow colors', previewColor: '#FF0000' }
  ];
  
  // Define background skins
  const backgroundSkins = [
    { id: 'default', name: 'Classic', price: 0, isPremium: false, description: 'The basic game background', previewColor: '#1a1a2e' },
    { id: 'gradient', name: 'Gradient', price: 200, isPremium: false, description: 'Smooth color gradients', previewColor: '#2d3436' },
    { id: 'stars', name: 'Starry Night', price: 400, isPremium: true, description: 'Distant twinkling stars', previewColor: '#000033' },
    { id: 'aurora', name: 'Aurora Borealis', price: 600, isPremium: true, description: 'Dancing northern lights', previewColor: '#004d40' },
    { id: 'galaxy', name: 'Galaxy Swirl', price: 800, isPremium: true, description: 'Deep space cosmic clouds', previewColor: '#311b92' },
    { id: 'ocean', name: 'Ocean Depths', price: 500, isPremium: false, description: 'Brilliant underwater view', previewColor: '#01579b' },
    { id: 'forest', name: 'Forest Canopy', price: 700, isPremium: true, description: 'Lush green forest view', previewColor: '#1b5e20' },
    { id: 'mountain', name: 'Mountain Peak', price: 900, isPremium: true, description: 'Snowy peak landscape', previewColor: '#37474f' }
  ];
  
  // Get current items based on selected tab
  const getItems = () => {
    switch (selectedTab) {
      case 'tube':
        return tubeSkins;
      case 'liquid':
        return liquidSkins;
      case 'background':
        return backgroundSkins;
      default:
        return [];
    }
  };
  
  const items = getItems();
  
  // Check if item is owned
  const isOwned = (item: any): boolean => {
    if (selectedTab === 'tube') {
      return gameState.purchasedSkins.includes(item.id as TubeSkin);
    } else if (selectedTab === 'background') {
      return gameState.backgroundSkins.includes(item.id);
    } else if (selectedTab === 'liquid') {
      // For liquid skins, check if it's assigned to any color
      return Object.values(gameState.liquidSkins).includes(item.id);
    }
    return false;
  };
  
  // Handle purchase
  const handlePurchase = async (item: any) => {
    if (isOwned(item)) {
      setPurchaseError('Already owned!');
      return;
    }
    
    setIsPurchasing(true);
    setPurchaseSuccess(null);
    setPurchaseError(null);
    
    try {
      if (selectedTab === 'tube') {
        const success = purchaseSkin(item.id as TubeSkin, item.price, 'coins');
        if (success) {
          setPurchaseSuccess(`Purchased ${item.name}!`);
        } else {
          setPurchaseError('Purchase failed! Check your coins.');
        }
      } else {
        // For background and liquid skins
        if (gameState.coins >= item.price) {
          if (spendCoins(item.price)) {
            if (selectedTab === 'background') {
              unlockBackgroundSkin(item.id);
              setPurchaseSuccess(`Unlocked ${item.name}!`);
            } else if (selectedTab === 'liquid') {
              // Apply liquid skin to all current colors for now
              liquidColors.forEach(color => unlockLiquidSkin(color, item.id));
              setPurchaseSuccess(`Unlocked ${item.name} effects!`);
            }
          } else {
            setPurchaseError('Purchase failed!');
          }
        } else {
          setPurchaseError('Not enough coins!');
        }
      }
    } catch (error) {
      setPurchaseError('An error occurred during purchase.');
    } finally {
      setIsPurchasing(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>STORE</Text>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsIcon}>💰</Text>
          <Text style={[styles.coinsAmount, { color: colors.title }]}>{gameState.coins}</Text>
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        {([['tube', 'Tube Skins'], ['liquid', 'Liquid Effects'], ['background', 'Backgrounds']] as const).map(([tab, label]) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={styles.tabButtonText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {purchaseSuccess && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>{purchaseSuccess}</Text>
        </View>
      )}
      
      {purchaseError && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{purchaseError}</Text>
        </View>
      )}
      
      <View style={styles.itemsContainer}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const owned = isOwned(item);
            let selected = false;
            
            if (selectedTab === 'tube') {
              selected = gameState.purchasedSkins[gameState.purchasedSkins.length - 1] === item.id;
            } else if (selectedTab === 'background') {
              selected = gameState.backgroundSkins[gameState.backgroundSkins.length - 1] === item.id;
            } else if (selectedTab === 'liquid') {
              // Consider selected if any color uses it
              selected = Object.values(gameState.liquidSkins).includes(item.id);
            }
            
            return (
              <View style={[styles.itemCard, owned && styles.ownedItem, selected && styles.selectedItem]}>
                <BlurView intensity={20} tint="dark" style={styles.glassEffect}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemPreview}>
                      {selectedTab === 'tube' && (
                        <View style={[
                          styles.tubePreview,
                          { backgroundColor: item.previewColor }
                        ]}>
                          <Text style={styles.tubePreviewText}>|||</Text>
                        </View>
                      )}
                      {selectedTab === 'liquid' && (
                        <View style={[
                          styles.liquidPreview,
                          { backgroundColor: liquidColors[0] }
                        ]}>
                          <Text style={styles.liquidPreviewText}>~</Text>
                        </View>
                      )}
                      {selectedTab === 'background' && (
                        <View style={styles.backgroundPreview}>
                          <Text style={styles.backgroundPreviewText}>🌄</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.title }]}>{item.name}</Text>
                      <Text style={[styles.itemDescription, { color: colors.subtitle }]}>{item.description}</Text>
                      {item.price > 0 && (
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceIcon}>💰</Text>
                          <Text style={[styles.priceText, { color: colors.title }]}>{item.price}</Text>
                        </View>
                      )}
                      {owned && (
                        <Text style={styles.ownedText}>OWNED</Text>
                      )}
                      {selected && (
                        <Text style={styles.selectedText}>EQUIPPED</Text>
                      )}
                      {!owned && !selected && (
                        <TouchableOpacity
                          style={[styles.purchaseButton, item.isPremium && styles.premiumButton]}
                          onPress={() => handlePurchase(item)}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.purchaseButtonText}>BUY</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </BlurView>
              </View>
            );
          }}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  coinsAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#rgba(255,255,255,0.1)',
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#rgba(255,255,255,0.7)',
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  flatListContent: {
    paddingBottom: 80,
  },
  itemCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    width: (Dimensions.get('window').width - 48) / 2,
  },
  glassEffect: {
    padding: 16,
    flex: 1,
  },
  itemContent: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 4,
  },
  ownedItem: {
    borderColor: '#4ECDC4',
  },
  selectedItem: {
    borderColor: '#4ECDC4',
    transform: [{ scale: 1.02 }],
  },
  itemPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  tubePreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  tubePreviewText: {
    fontSize: 18,
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  liquidPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  liquidPreviewText: {
    fontSize: 24,
    color: '#fff',
  },
  backgroundPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  backgroundPreviewText: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    display: 'flex',
  },
  priceIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ownedText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  purchaseButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButton: {
    backgroundColor: '#FF6B6B',
  },
  purchaseButtonText: {
    color: '#1a1a2e',
    fontWeight: '700',
    fontSize: 16,
  },
  successMessage: {
    backgroundColor: '#rgba(78,205,196,0.2)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  successText: {
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: '#rgba(255,107,107,0.2)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },
});