import React from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #f3f4f6;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const CardContent = styled.p`
  color: #4b5563;
`;


const PatientDashboard = () => {
  return (
    <DashboardContainer>
      <Container>
        <Title>Patient Dashboard</Title>
        <CardGrid>
          {/* Appointments Card */}
          <Card>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardContent>You have no upcoming appointments.</CardContent>
          </Card>

          {/* Prescriptions Card */}
          <Card>
            <CardTitle>Active Prescriptions</CardTitle>
            <CardContent>You have no active prescriptions.</CardContent>
          </Card>

          {/* Lab Results Card */}
          <Card>
            <CardTitle>Recent Lab Results</CardTitle>
            <CardContent>No recent lab results found.</CardContent>
          </Card>
        </CardGrid>
      </Container>
    </DashboardContainer>
  );
};

export default PatientDashboard;
