const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

/**
 * CHECK FOR TIME SLOT CONFLICTS
 * A faculty member cannot teach multiple sections at the same time
 */
const checkTimeSlotConflicts = (existingAvailability, newAvailability) => {
  for (const newSlot of newAvailability) {
    const conflictingSlot = existingAvailability.find(
      slot => slot.day === newSlot.day && 
             slot.periods.some(p => newSlot.periods.includes(p))
    );
    
    if (conflictingSlot) {
      const conflictingPeriods = conflictingSlot.periods
        .filter(p => newSlot.periods.includes(p));
      return {
        hasConflict: true,
        day: conflictingSlot.day,
        periods: conflictingPeriods
      };
    }
  }
  return { hasConflict: false };
};

/**
 * GET ALL FACULTY
 */
const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate('subject')
      .populate('department')
      .populate('section');

    console.log(`✅ Retrieved ${faculty.length} faculty members`);

    return res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('❌ Error fetching faculty:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * GET FACULTY BY ID
 */
const getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findById(id)
      .populate('subject')
      .populate('department')
      .populate('section');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    console.error('❌ Error fetching faculty by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * CREATE FACULTY
 */
const createFaculty = async (req, res) => {
  try {
    const { name, subjectCode, section, availability } = req.body;

    console.log('📥 Received faculty creation request:', { name, subjectCode, section, availability });

    // Validation
    if (!name || !subjectCode || !section || !availability) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, section, and availability are required'
      });
    }

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one availability slot is required'
      });
    }

    // Find subject by code
    const subjectDoc = await Subject.findOne({ code: subjectCode }).populate('department');
    
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: `Subject with code "${subjectCode}" not found`
      });
    }

    console.log('✅ Found subject:', subjectDoc.name, 'Department:', subjectDoc.department.name);

    // CRITICAL: Check if this FACULTY (by name) already has conflicting time slots
    // This prevents Shinobu from teaching 2H and 2E at the same time
    const existingFacultyByName = await Faculty.find({ 
      name: name.trim() 
    }).populate('section');
    
    if (existingFacultyByName.length > 0) {
      console.log(`🔍 Found ${existingFacultyByName.length} existing entries for faculty: ${name}`);
      
      for (const existingEntry of existingFacultyByName) {
        const conflict = checkTimeSlotConflicts(existingEntry.availability, availability);
        
        if (conflict.hasConflict) {
          return res.status(400).json({
            success: false,
            message: `Time slot conflict: ${name} is already teaching section ${existingEntry.section.code} on ${conflict.day}, Period(s) ${conflict.periods.join(', ')}. A faculty member cannot teach multiple sections at the same time.`
          });
        }
      }
    }

    // Also check if another faculty is already teaching THIS section at the same time
    const conflictingFaculty = await Faculty.find({ section: section })
      .populate('section');
    
    for (const existingFaculty of conflictingFaculty) {
      const conflict = checkTimeSlotConflicts(existingFaculty.availability, availability);
      
      if (conflict.hasConflict) {
        return res.status(400).json({
          success: false,
          message: `Time slot conflict: ${existingFaculty.name} is already teaching section ${existingFaculty.section.code} on ${conflict.day}, Period(s) ${conflict.periods.join(', ')}`
        });
      }
    }

    // Create faculty
    const faculty = await Faculty.create({
      name: name.trim(),
      subject: subjectDoc._id,
      department: subjectDoc.department._id,
      section: section,
      availability
    });

    // Populate the created faculty
    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('subject')
      .populate('department')
      .populate('section');

    console.log('✅ Faculty created successfully:', populatedFaculty.name);

    return res.status(201).json({
      success: true,
      data: populatedFaculty,
      message: 'Faculty created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating faculty:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * UPDATE FACULTY
 */
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subjectCode, section, availability } = req.body;

    console.log('📥 Received faculty update request:', { id, name, subjectCode, section, availability });

    // Validation
    if (!name || !subjectCode || !section || !availability) {
      return res.status(400).json({
        success: false,
        message: 'Name, subject, section, and availability are required'
      });
    }

    // Find subject by code
    const subjectDoc = await Subject.findOne({ code: subjectCode }).populate('department');
    
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: `Subject with code "${subjectCode}" not found`
      });
    }

    // Check for conflicts with OTHER entries of the SAME faculty (by name)
    const existingFacultyByName = await Faculty.find({ 
      name: name.trim(),
      _id: { $ne: id } // Exclude current entry being updated
    }).populate('section');
    
    if (existingFacultyByName.length > 0) {
      console.log(`🔍 Found ${existingFacultyByName.length} other entries for faculty: ${name}`);
      
      for (const existingEntry of existingFacultyByName) {
        const conflict = checkTimeSlotConflicts(existingEntry.availability, availability);
        
        if (conflict.hasConflict) {
          return res.status(400).json({
            success: false,
            message: `Time slot conflict: ${name} is already teaching section ${existingEntry.section.code} on ${conflict.day}, Period(s) ${conflict.periods.join(', ')}. A faculty member cannot teach multiple sections at the same time.`
          });
        }
      }
    }

    // Check for conflicts with other faculty teaching the SAME section
    const conflictingFaculty = await Faculty.find({ 
      section: section,
      _id: { $ne: id }
    }).populate('section');
    
    for (const existingFaculty of conflictingFaculty) {
      const conflict = checkTimeSlotConflicts(existingFaculty.availability, availability);
      
      if (conflict.hasConflict) {
        return res.status(400).json({
          success: false,
          message: `Time slot conflict: ${existingFaculty.name} is already teaching section ${existingFaculty.section.code} on ${conflict.day}, Period(s) ${conflict.periods.join(', ')}`
        });
      }
    }

    // Update faculty
    const faculty = await Faculty.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        subject: subjectDoc._id,
        department: subjectDoc.department._id,
        section: section,
        availability
      },
      { new: true, runValidators: true }
    )
      .populate('subject')
      .populate('department')
      .populate('section');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    console.log('✅ Faculty updated successfully:', faculty.name);

    return res.status(200).json({
      success: true,
      data: faculty,
      message: 'Faculty updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating faculty:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * DELETE FACULTY
 */
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findByIdAndDelete(id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    console.log('✅ Faculty deleted successfully:', faculty.name);

    return res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting faculty:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
};