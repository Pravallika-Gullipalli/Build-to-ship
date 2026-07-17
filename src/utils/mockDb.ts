import type { User } from '../types/user';
import type { Complaint } from '../types/complaint';
import type { AILog } from '../types/ai';

interface DbSchema {
  users: User[];
  complaints: Complaint[];
  aiLogs: AILog[];
  currentUser: User | null;
}

const STORAGE_KEY = 'civicfix_mock_db';

const defaultUsers: User[] = [
  {
    id: 'user-citizen',
    name: 'Jane Doe',
    email: 'citizen@civicfix.gov',
    role: 'citizen',
    phone: '+1 (555) 019-2834',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-officer',
    name: 'Officer Robert Chen',
    email: 'officer@civicfix.gov',
    role: 'officer',
    phone: '+1 (555) 014-9988',
    department: 'Public Works',
    assignedRegion: 'Downtown Sector',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-admin',
    name: 'Director Sarah Jenkins',
    email: 'admin@civicfix.gov',
    role: 'admin',
    phone: '+1 (555) 012-3456',
    department: 'Municipal Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const defaultComplaints: Complaint[] = [
  {
    id: 'comp-1',
    title: 'Severe Water Main Leak',
    description: 'A large volume of water is gushing out from under the pavement on 14th Street. It is flooding the sidewalk and creating a hazard for traffic.',
    category: 'Water & Sewer',
    priority: 'critical',
    status: 'assigned',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    location: {
      lat: 37.7699,
      lng: -122.4468,
      address: '730 14th St, San Francisco, CA 94114'
    },
    reporterId: 'user-citizen',
    reporterName: 'Jane Doe',
    assignedOfficerId: 'user-officer',
    assignedOfficerName: 'Officer Robert Chen',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reportsCount: 4,
    estimatedResolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    aiNotes: 'AI Detection: Confidence 98.7% - Water gushing, street flooding detected. Duplicate identified (4 reports matched nearby). Critical priority due to potential traffic accidents and infrastructure decay.',
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Complaint submitted by Jane Doe', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'AI scanned and classified. Priority rated CRITICAL.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Assigned to Public Works Division (Officer Robert Chen)', timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'work_started', title: 'Repair In Progress', description: 'Public Works crew dispatched to seal the pipe', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Leak sealed and pavement dried', timestamp: '', completed: false }
    ],
    comments: [
      {
        id: 'comm-1-1',
        complaintId: 'comp-1',
        userId: 'user-officer',
        userName: 'Officer Robert Chen',
        userRole: 'officer',
        content: 'I have dispatched a water utility team. We will shut off the local main valve to stop the leak.',
        createdAt: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'comp-2',
    title: 'Hazardous Deep Pothole',
    description: 'Extremely deep pothole in the middle lane of Market Street near 5th. Multiple cars are swerving to avoid it. High risk of tire damage.',
    category: 'Roads & Traffic',
    priority: 'high',
    status: 'work_started',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800',
    location: {
      lat: 37.7838,
      lng: -122.4084,
      address: '815 Market St, San Francisco, CA 94103'
    },
    reporterId: 'user-citizen',
    reporterName: 'Jane Doe',
    assignedOfficerId: 'user-officer',
    assignedOfficerName: 'Officer Robert Chen',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reportsCount: 1,
    estimatedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    aiNotes: 'AI Detection: Confidence 94.2% - Road crater detected. High severity based on road speed limit and vehicle collision risk.',
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Complaint submitted by citizen', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'AI scanned and classified. Priority rated HIGH.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 4000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Assigned to Roads Repair Dept (Officer Robert Chen)', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'work_started', title: 'Repair In Progress', description: 'Patching truck has arrived and is filling the pothole with hot-mix asphalt.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'resolved', title: 'Resolved', description: 'Pothole fully patched', timestamp: '', completed: false }
    ],
    comments: [
      {
        id: 'comm-2-1',
        complaintId: 'comp-2',
        userId: 'user-officer',
        userName: 'Officer Robert Chen',
        userRole: 'officer',
        content: 'Patching crew is currently on-site. Expect lane closure for 30 minutes.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'comp-3',
    title: 'Broken Streetlight',
    description: 'The streetlight at the intersection of Valencia and 18th has been out for a week, leaving the corner completely pitch black at night.',
    category: 'Public Lighting',
    priority: 'medium',
    status: 'submitted',
    imageUrl: 'https://images.unsplash.com/photo-1509021436665-8f37df706a73?auto=format&fit=crop&q=80&w=800',
    location: {
      lat: 37.7618,
      lng: -122.4218,
      address: '702 Valencia St, San Francisco, CA 94110'
    },
    reporterId: 'user-citizen',
    reporterName: 'Jane Doe',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reportsCount: 1,
    estimatedResolutionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    aiNotes: 'AI Detection: Confidence 89.1% - Dark streetlight post identified. Medium priority based on crime statistics in low-light blocks.',
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Complaint submitted by citizen', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'AI scanned and classified. Priority rated MEDIUM.', timestamp: '', completed: false },
      { status: 'assigned', title: 'Officer Assigned', description: 'Assigned to Lighting Division', timestamp: '', completed: false },
      { status: 'work_started', title: 'Repair In Progress', description: 'Crew replacing bulb or ballast', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Bulb replaced and light active', timestamp: '', completed: false }
    ],
    comments: []
  },
  {
    id: 'comp-4',
    title: 'Illegal Dumping of Construction Waste',
    description: 'Someone has dumped a heap of drywall, metal studs, and paint cans directly onto the sidewalk, blocking wheelchair access.',
    category: 'Sanitation',
    priority: 'high',
    status: 'resolved',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    location: {
      lat: 37.7512,
      lng: -122.4184,
      address: '3200 24th St, San Francisco, CA 94110'
    },
    reporterId: 'another-citizen',
    reporterName: 'John Miller',
    assignedOfficerId: 'user-officer',
    assignedOfficerName: 'Officer Robert Chen',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reportsCount: 1,
    aiNotes: 'AI Detection: Confidence 91.5% - Building debris, drywall piles detected. Rated HIGH due to complete obstruction of ADA sidewalk access.',
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Complaint submitted by John Miller', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'AI scanned and classified. Priority rated HIGH.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 8000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Assigned to Sanitation Operations', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'work_started', title: 'Cleanup Commenced', description: 'Sanitation flatbed dispatch to clear site', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'resolved', title: 'Resolved', description: 'Sidewalk fully cleared, swept, and opened. Hazardous material disposed.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: true }
    ],
    comments: [
      {
        id: 'comm-4-1',
        complaintId: 'comp-4',
        userId: 'user-officer',
        userName: 'Officer Robert Chen',
        userRole: 'officer',
        content: 'Sidewalk has been fully cleared. Heavy machinery waste was logged in the sanitation tracking database.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'comp-5',
    title: 'Overgrown Vegetation Blocking Stop Sign',
    description: 'The bushes from the corner house are completely covering the STOP sign, making it impossible for drivers to see it until they are right in the intersection.',
    category: 'Parks & Recreation',
    priority: 'high',
    status: 'ai_verified',
    imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600',
    location: {
      lat: 37.7456,
      lng: -122.4764,
      address: '2400 Noriega St, San Francisco, CA 94122'
    },
    reporterId: 'user-citizen',
    reporterName: 'Jane Doe',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
    reportsCount: 1,
    estimatedResolutionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    aiNotes: 'AI Detection: Confidence 97.4% - Stop sign occlusion detected. Elevated to HIGH priority as this creates a critical intersection accident risk.',
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Complaint submitted by citizen', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'AI scanned and classified. Priority rated HIGH.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Assigned to Urban Forestry', timestamp: '', completed: false },
      { status: 'work_started', title: 'Pruning Arranged', description: 'Horticulture crew scheduled for clearance', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Bushes trimmed, stop sign 100% visible', timestamp: '', completed: false }
    ],
    comments: []
  }
];

const defaultAiLogs: AILog[] = [
  {
    id: 'ailog-1',
    complaintId: 'comp-1',
    action: 'Image Classification',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.987,
    outcome: 'Classified: Water Leak. Confidence: 98.7%. Priority predicted: CRITICAL.',
    status: 'success'
  },
  {
    id: 'ailog-2',
    complaintId: 'comp-1',
    action: 'Duplicate Check',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2000).toISOString(),
    confidence: 0.999,
    outcome: 'Found 3 other active complaints within 50m. Merged reports count.',
    status: 'warning'
  },
  {
    id: 'ailog-3',
    complaintId: 'comp-2',
    action: 'Image Classification',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.942,
    outcome: 'Classified: Pothole. Confidence: 94.2%. Priority predicted: HIGH.',
    status: 'success'
  },
  {
    id: 'ailog-4',
    complaintId: 'comp-3',
    action: 'Priority Prediction',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    confidence: 0.891,
    outcome: 'Classified: Broken Light. Priority predicted: MEDIUM.',
    status: 'success'
  },
  {
    id: 'ailog-5',
    complaintId: 'comp-5',
    action: 'Image Classification',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.974,
    outcome: 'Classified: Occluded Sign. Stop Sign detected. Priority predicted: HIGH.',
    status: 'success'
  }
];

export const getDb = (): DbSchema => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const db: DbSchema = {
      users: defaultUsers,
      complaints: defaultComplaints,
      aiLogs: defaultAiLogs,
      currentUser: defaultUsers[0] // Default is Jane Doe (citizen)
    };
    saveDb(db);
    return db;
  }
  try {
    return JSON.parse(raw);
  } catch {
    // If corruption, reset
    const db: DbSchema = {
      users: defaultUsers,
      complaints: defaultComplaints,
      aiLogs: defaultAiLogs,
      currentUser: defaultUsers[0]
    };
    saveDb(db);
    return db;
  }
};

export const saveDb = (db: DbSchema): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const updateDb = (updater: (db: DbSchema) => void): DbSchema => {
  const db = getDb();
  updater(db);
  saveDb(db);
  return db;
};
