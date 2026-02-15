package com.example.donzoom.dto.user.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class ChildRequest {
  private List<String> childEmails;

  @JsonCreator
  public ChildRequest(@JsonProperty("childEmails") List<String> childEmails) {
    this.childEmails = childEmails;
  }
}