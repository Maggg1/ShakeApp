// Test script to debug timestamp parsing issues in recent activities
// This will help identify why all activities show as "Today"

function testTimestampParsing() {
  console.log('=== Timestamp Parsing Debug Test ===\n');

  // Mock activity data that might come from backend
  const mockActivities = [
    {
      id: '1',
      type: 'shake',
      title: 'Shake',
      timestamp: new Date().toISOString(), // Today
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'shake',
      title: 'Shake',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'shake',
      title: 'Shake',
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago (epoch ms)
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: '4',
      type: 'shake',
      title: 'Shake',
      timestamp: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60, // 3 days ago (epoch seconds)
      createdAt: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
    },
    {
      id: '5',
      type: 'shake',
      title: 'Shake',
      timestamp: '2024-01-15T10:00:00Z', // Fixed date
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '6',
      type: 'shake',
      title: 'Shake',
      timestamp: { seconds: Math.floor(Date.now() / 1000) - 4 * 24 * 60 * 60 }, // Firebase-style
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 4 * 24 * 60 * 60 },
    }
  ];

  // Replicate the timestamp parsing logic from DashboardScreen
  function parseTimestamp(activity) {
    console.log(`\n--- Parsing activity ${activity.id} ---`);
    console.log('Raw timestamp:', activity.timestamp);
    console.log('Raw createdAt:', activity.createdAt);

    // Handle timestamp parsing more robustly
    let timestamp = null;
    const timestampSource = activity.timestamp || activity.createdAt || activity.updatedAt;

    console.log('Using timestampSource:', timestampSource);
    console.log('Type of timestampSource:', typeof timestampSource);

    if (timestampSource != null) {
      // Numbers may be epoch seconds or ms; strings may be ISO or numeric
      if (typeof timestampSource === 'number') {
        console.log('Processing as number...');
        // treat < 1e12 as seconds
        const multiplier = timestampSource < 1e12 ? 1000 : 1;
        timestamp = new Date(timestampSource * multiplier);
        console.log(`Converted number ${timestampSource} * ${multiplier} = ${timestamp}`);
      } else if (typeof timestampSource === 'string') {
        console.log('Processing as string...');
        // numeric string?
        const numeric = Number(timestampSource);
        if (!Number.isNaN(numeric)) {
          console.log(`String is numeric: ${numeric}`);
          const multiplier = numeric < 1e12 ? 1000 : 1;
          timestamp = new Date(numeric * multiplier);
          console.log(`Converted numeric string ${numeric} * ${multiplier} = ${timestamp}`);
        } else {
          console.log('String is not numeric, parsing as ISO string...');
          timestamp = new Date(timestampSource);
          console.log(`Parsed ISO string = ${timestamp}`);
        }
      } else if (timestampSource && timestampSource.seconds) {
        console.log('Processing Firebase-style timestamp...');
        timestamp = new Date(timestampSource.seconds * 1000);
        console.log(`Converted Firebase seconds ${timestampSource.seconds} * 1000 = ${timestamp}`);
      } else if (timestampSource instanceof Date) {
        console.log('Already a Date object...');
        timestamp = timestampSource;
      }
    }

    console.log('Final parsed timestamp:', timestamp);
    console.log('Is valid date?', timestamp instanceof Date && !isNaN(timestamp.getTime()));

    return timestamp;
  }

  // Test formatDate function
  function formatDate(date) {
    if (!date) return '';

    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    console.log(`\n--- Formatting date ---`);
    console.log('Input date:', date);
    console.log('Current date:', now);
    console.log('Diff in days:', diffDays);

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Process each mock activity
  console.log('Processing mock activities...\n');

  mockActivities.forEach(activity => {
    const parsedTimestamp = parseTimestamp(activity);
    const formattedDate = formatDate(parsedTimestamp);
    console.log(`Activity ${activity.id} formatted as: "${formattedDate}"`);
    console.log('---');
  });

  // Test edge cases
  console.log('\n=== Testing Edge Cases ===');

  // Test null/undefined timestamps
  console.log('\nTest 1: Null timestamp');
  const nullActivity = { id: 'null-test', timestamp: null, createdAt: null };
  const nullParsed = parseTimestamp(nullActivity);
  console.log('Null timestamp result:', nullParsed);

  // Test invalid date strings
  console.log('\nTest 2: Invalid date string');
  const invalidActivity = { id: 'invalid-test', timestamp: 'not-a-date' };
  const invalidParsed = parseTimestamp(invalidActivity);
  console.log('Invalid date result:', invalidParsed);
  console.log('Is valid?', invalidParsed instanceof Date && !isNaN(invalidParsed.getTime()));

  // Test current date comparison
  console.log('\nTest 3: Date comparison logic');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  console.log('Today:', today.toDateString());
  console.log('Yesterday:', yesterday.toDateString());
  console.log('Diff calculation:');
  console.log('Math.floor((today - yesterday) / (1000 * 60 * 60 * 24)) =',
    Math.floor((today - yesterday) / (1000 * 60 * 60 * 24)));

  console.log('\n=== Timestamp Parsing Test Complete ===');
  console.log('\nIf all activities show as "Today", the issue is likely:');
  console.log('1. Backend returning incorrect timestamps');
  console.log('2. Timestamp parsing logic failing');
  console.log('3. Date comparison logic error');
  console.log('4. All activities actually being from today');
}

testTimestampParsing();
