/**
 * Sorts school grades in chronological progression order.
 * Nursery/Preschool grades (NUR, LKG, UKG, PREP, KG) come first.
 * Numeric grades (1 to 12) are sorted numerically next.
 * Roman numerals (I to XII) are mapped to numeric values.
 * Custom/Other grades are sorted alphabetically at the end.
 * 
 * @param {Array<string>} gradesArray 
 * @returns {Array<string>} Sorted grades
 */
export const sortGrades = (gradesArray) => {
  if (!gradesArray || !Array.isArray(gradesArray)) return [];
  const preschoolOrder = ['NURSERY', 'NUR', 'LKG', 'UKG', 'PREP', 'KG'];
  
  const getGradeWeight = (grade) => {
    const g = String(grade).trim().toUpperCase();
    
    // Preschool mapping
    const orderIdx = preschoolOrder.indexOf(g);
    if (orderIdx !== -1) {
      return orderIdx - 100; // negative weights to place preschool first
    }
    
    // Numeric grades (1 to 12)
    const num = parseInt(g, 10);
    if (!isNaN(num)) {
      return num;
    }
    
    // Roman numerals mapping
    const romanMapping = { 
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 
      'XI': 11, 'XII': 12 
    };
    if (romanMapping[g]) {
      return romanMapping[g];
    }
    
    return 1000; // Custom grades sorted alphabetically at the end
  };

  return [...gradesArray].sort((a, b) => {
    const wA = getGradeWeight(a);
    const wB = getGradeWeight(b);
    if (wA !== wB) return wA - wB;
    return String(a).localeCompare(String(b));
  });
};

/**
 * Sorts sections in alphabetical/numerical order.
 * E.g., A, B, C, D... or numeric sections.
 * 
 * @param {Array<string>} sectionsArray 
 * @returns {Array<string>} Sorted sections
 */
export const sortSections = (sectionsArray) => {
  if (!sectionsArray || !Array.isArray(sectionsArray)) return [];
  
  return [...sectionsArray].sort((a, b) => {
    const sA = String(a).trim().toUpperCase();
    const sB = String(b).trim().toUpperCase();
    const numA = parseInt(sA, 10);
    const numB = parseInt(sB, 10);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return sA.localeCompare(sB);
  });
};
