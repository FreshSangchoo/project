import React from 'react';
import { StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const ArticleSkeleton = () => (
  <SkeletonPlaceholder borderRadius={8}>
    <SkeletonPlaceholder.Item style={styles.container}>
      <SkeletonPlaceholder.Item style={styles.thumbnail} />
      <SkeletonPlaceholder.Item style={styles.title} />
      <SkeletonPlaceholder.Item style={styles.subtitle} />
    </SkeletonPlaceholder.Item>
  </SkeletonPlaceholder>
);

export default ArticleSkeleton;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    width: 140,
    height: 16,
    marginBottom: 10,
  },
  subtitle: {
    width: '90%',
    height: 16,
  },
});
