  // Method to convert human-readable string back to enum value
  export function getPlaceTypeFromString(typeString: string): string | null {
    switch (typeString) {
      case '5-a-side':
        return 'FIVE';
      case '7-a-side':
        return 'SEVEN';
      case '11-a-side':
        return 'ELEVEN';
      // Also handle direct enum values
      case 'FIVE':
      case 'SEVEN':
      case 'ELEVEN':
        return typeString;
      default:
        return null;
    }
  }


  export function getPlaceTypeString(type: string): string {
    // Handle string values
    switch (type) {
      case 'FIVE':
        return '5-a-side';
      case 'SEVEN':
        return '7-a-side';
      case 'ELEVEN':
        return '11-a-side';
      default:
        console.warn('Unknown place type:', type);
        return 'Unknown';
    }
  }
